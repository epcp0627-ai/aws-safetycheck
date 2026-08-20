"""AWS SafetyCheck Lambda backend. Read-only account snapshot for CIS impact analysis."""
import json, os, hmac, datetime
import boto3

REGION=os.environ.get('TARGET_REGION','ap-northeast-1')
API_TOKEN=os.environ.get('SAFETYCHECK_API_TOKEN','')

def resp(code,body):
    return {'statusCode':code,'headers':{'content-type':'application/json'},'body':json.dumps(body,ensure_ascii=False,default=str)}

def authorized(event):
    h=event.get('headers') or {}; v=h.get('x-safetycheck-token') or h.get('X-SafetyCheck-Token') or ''
    return bool(API_TOKEN) and hmac.compare_digest(str(v),API_TOKEN)

def assume(role_arn,external_id=''):
    a={'RoleArn':role_arn,'RoleSessionName':'SafetyCheckReadOnly','DurationSeconds':900}
    if external_id:a['ExternalId']=external_id
    c=boto3.client('sts').assume_role(**a)['Credentials']
    return {'aws_access_key_id':c['AccessKeyId'],'aws_secret_access_key':c['SecretAccessKey'],'aws_session_token':c['SessionToken'],'region_name':REGION}

def cli(name,creds,region=None):
    x=dict(creds)
    if region:x['region_name']=region
    return boto3.client(name,**x)

def safe(fn,default=None):
    try:return fn(),None
    except Exception as e:return default,str(e)

def secure_transport(policy):
    try:p=json.loads(policy)
    except:return False
    ss=p.get('Statement',[]); ss=ss if isinstance(ss,list) else [ss]
    for s in ss:
        if str(s.get('Effect','')).lower()!='deny':continue
        cond=s.get('Condition',{})
        for op in ('Bool','StringEquals'):
            if str((cond.get(op) or {}).get('aws:SecureTransport','')).lower()=='false':return True
    return False

def snapshot(creds):
    errors={}; out={'region':REGION,'errors':errors}
    sts=cli('sts',creds); ident,e=safe(lambda:sts.get_caller_identity(),{})
    out['account']=(ident or {}).get('Account')

    # EC2 / network / EBS
    ec2=cli('ec2',creds); ed={'defaultSecurityGroups':[],'adminOpen':[],'vpcsWithoutFlowLogs':[],'unencryptedVolumes':[]}
    vpcs,e=safe(lambda:ec2.describe_vpcs().get('Vpcs',[]),[]); errors.update({'ec2.vpcs':e} if e else {}); ed['vpcCount']=len(vpcs)
    sgs,e=safe(lambda:ec2.describe_security_groups().get('SecurityGroups',[]),[]); errors.update({'ec2.securityGroups':e} if e else {})
    enis_cache={}
    def eni_count(gid):
        if gid not in enis_cache:
            a,er=safe(lambda:ec2.describe_network_interfaces(Filters=[{'Name':'group-id','Values':[gid]}]).get('NetworkInterfaces',[]),[])
            enis_cache[gid]=a or []
        return enis_cache[gid]
    for sg in sgs:
        if sg.get('GroupName')=='default':
            en=eni_count(sg['GroupId']); ed['defaultSecurityGroups'].append({'groupId':sg['GroupId'],'vpcId':sg.get('VpcId'),'ruleCount':len(sg.get('IpPermissions',[]))+len(sg.get('IpPermissionsEgress',[])),'enis':[{'id':x.get('NetworkInterfaceId'),'type':x.get('InterfaceType'),'description':x.get('Description')} for x in en[:10]]})
        ports=[]
        for p in sg.get('IpPermissions',[]):
            public=any(x.get('CidrIp')=='0.0.0.0/0' for x in p.get('IpRanges',[])) or any(x.get('CidrIpv6')=='::/0' for x in p.get('Ipv6Ranges',[]))
            if not public:continue
            if p.get('IpProtocol')=='-1':ports.extend([22,3389])
            elif p.get('FromPort') is not None:
                ports.extend([z for z in (22,3389) if p['FromPort']<=z<=p['ToPort']])
        ports=sorted(set(ports))
        if ports:ed['adminOpen'].append({'groupId':sg['GroupId'],'name':sg.get('GroupName'),'ports':ports,'eniCount':len(eni_count(sg['GroupId']))})
    fl,e=safe(lambda:ec2.describe_flow_logs().get('FlowLogs',[]),[]); active={x.get('ResourceId') for x in fl or [] if x.get('FlowLogStatus')=='ACTIVE'}
    ed['vpcsWithoutFlowLogs']=[v.get('VpcId') for v in vpcs if v.get('VpcId') not in active]
    enc,e=safe(lambda:ec2.get_ebs_encryption_by_default().get('EbsEncryptionByDefault'),None); ed['ebsEncryptionDefault']=enc
    vols,e=safe(lambda:ec2.describe_volumes().get('Volumes',[]),[]); ed['unencryptedVolumes']=[{'id':v.get('VolumeId'),'size':v.get('Size')} for v in vols if not v.get('Encrypted')][:30]
    out['ec2']=ed

    # RDS
    rds=cli('rds',creds); dbs,e=safe(lambda:rds.describe_db_instances().get('DBInstances',[]),[]); errors.update({'rds':e} if e else {})
    out['rds']={'instances':[{'id':d.get('DBInstanceIdentifier'),'class':d.get('DBInstanceClass'),'engine':d.get('Engine'),'version':d.get('EngineVersion'),'storage':d.get('AllocatedStorage'),'multiAZ':d.get('MultiAZ'),'autoMinor':d.get('AutoMinorVersionUpgrade'),'publiclyAccessible':d.get('PubliclyAccessible'),'encrypted':d.get('StorageEncrypted')} for d in dbs]}

    # CloudTrail + log bucket access logging
    ct=cli('cloudtrail',creds); trails,e=safe(lambda:ct.describe_trails(includeShadowTrails=False).get('trailList',[]),[]); s3=cli('s3',creds); tlist=[]
    for t in trails:
        st,er=safe(lambda arn=t.get('TrailARN'):ct.get_trail_status(Name=arn),{})
        bucket=t.get('S3BucketName'); log_on=None
        if bucket:
            lg,le=safe(lambda b=bucket:s3.get_bucket_logging(Bucket=b),{}); log_on=bool((lg or {}).get('LoggingEnabled'))
        tlist.append({'name':t.get('Name'),'kmsKeyId':t.get('KmsKeyId'),'cloudWatchLogs':bool(t.get('CloudWatchLogsLogGroupArn')),'s3Bucket':bucket,'s3AccessLogging':log_on,'logFileValidation':bool(t.get('LogFileValidationEnabled')),'isLogging':bool((st or {}).get('IsLogging'))})
    out['cloudtrail']={'trails':tlist}

    # S3 configuration (cap 40 for MVP latency/cost safety)
    buckets,e=safe(lambda:s3.list_buckets().get('Buckets',[]),[]); bl=[]
    for b in (buckets or [])[:40]:
        name=b.get('Name'); pol,pe=safe(lambda n=name:s3.get_bucket_policy(Bucket=n),{}); ps,pse=safe(lambda n=name:s3.get_bucket_policy_status(Bucket=n),{})
        bpa,bpe=safe(lambda n=name:s3.get_public_access_block(Bucket=n),{})
        bl.append({'name':name,'sslEnforced':secure_transport((pol or {}).get('Policy','')),'public':((ps or {}).get('PolicyStatus') or {}).get('IsPublic'),'bpa':(bpa or {}).get('PublicAccessBlockConfiguration',{})})
    account_bpa={}
    if out.get('account'):
        s3c=cli('s3control',creds); ab,ae=safe(lambda:s3c.get_public_access_block(AccountId=out['account']),{})
        account_bpa=(ab or {}).get('PublicAccessBlockConfiguration',{})
    out['s3']={'buckets':bl,'accountBpa':account_bpa,'truncated':len(buckets or [])>40}

    # IAM / Access Analyzer
    iam=cli('iam',creds); summary,e=safe(lambda:iam.get_account_summary().get('SummaryMap',{}),{}); users,e=safe(lambda:iam.list_users().get('Users',[]),[])
    old=[]; now=datetime.datetime.now(datetime.timezone.utc)
    for u in (users or [])[:100]:
        keys,ke=safe(lambda n=u['UserName']:iam.list_access_keys(UserName=n).get('AccessKeyMetadata',[]),[])
        for k in keys or []:
            age=(now-k['CreateDate']).days
            if age>90:old.append({'user':u['UserName'],'last4':k['AccessKeyId'][-4:],'ageDays':age,'status':k.get('Status')})
    aa=cli('accessanalyzer',creds); ans,ae=safe(lambda:aa.list_analyzers().get('analyzers',[]),[])
    out['iam']={'accountMfa':bool((summary or {}).get('AccountMFAEnabled')),'rootAccessKeys':bool((summary or {}).get('AccountAccessKeysPresent')),'userCount':len(users or []),'oldAccessKeys':old[:40],'analyzers':[{'name':a.get('name'),'type':a.get('type'),'status':a.get('status')} for a in (ans or [])]}

    # Security alternate contact
    ac=cli('account',creds,region='us-east-1'); contact,ce=safe(lambda:ac.get_alternate_contact(AlternateContactType='SECURITY'),{})
    out['accountInfo']={'securityContact':bool((contact or {}).get('AlternateContact'))}
    out['account']=out.get('account')
    out['accountData']=out.pop('accountInfo')
    return out

def failed_findings(creds):
    sh=cli('securityhub',creds); out=[]
    pages=sh.get_paginator('get_findings').paginate(Filters={'ComplianceStatus':[{'Value':'FAILED','Comparison':'EQUALS'}],'RecordState':[{'Value':'ACTIVE','Comparison':'EQUALS'}]},PaginationConfig={'MaxItems':100})
    for page in pages:
        for f in page.get('Findings',[]):out.append({'id':f.get('Id'),'title':f.get('Title'),'severity':f.get('Severity',{}).get('Label'),'resources':[r.get('Id') for r in f.get('Resources',[])]})
    return out

def lambda_handler(event,_context):
    if not authorized(event):return resp(401,{'message':'unauthorized'})
    try:
        p=json.loads(event.get('body') or '{}'); creds=assume(p['roleArn'],p.get('externalId','')); action=p.get('action')
        if action=='snapshot':return resp(200,snapshot(creds))
        return resp(200,{'findings':failed_findings(creds)})
    except KeyError as e:return resp(400,{'message':f'missing field: {e}'})
    except Exception as e:return resp(500,{'message':str(e)})
