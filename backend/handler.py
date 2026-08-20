"""AWS SafetyCheck Lambda backend skeleton. Read-only by design."""
from __future__ import annotations
import json, os
from typing import Any
import boto3

REGION = os.environ.get("AWS_REGION", "ap-northeast-1")

def assume(role_arn: str, external_id: str) -> dict[str, Any]:
    sts = boto3.client("sts", region_name=REGION)
    args = {"RoleArn": role_arn, "RoleSessionName": "SafetyCheckReadOnly", "DurationSeconds": 900}
    if external_id:
        args["ExternalId"] = external_id
    c = sts.assume_role(**args)["Credentials"]
    return {"aws_access_key_id": c["AccessKeyId"], "aws_secret_access_key": c["SecretAccessKey"],
            "aws_session_token": c["SessionToken"], "region_name": REGION}

def clients(creds):
    return {n: boto3.client(n, **creds) for n in ["securityhub", "ec2", "rds", "cloudtrail", "s3"]}

def ec2_2_impact(c):
    groups = []
    for vpc in c["ec2"].describe_vpcs().get("Vpcs", []):
        resp = c["ec2"].describe_security_groups(Filters=[
            {"Name": "group-name", "Values": ["default"]},
            {"Name": "vpc-id", "Values": [vpc["VpcId"]]},
        ])
        for sg in resp.get("SecurityGroups", []):
            enis = c["ec2"].describe_network_interfaces(Filters=[
                {"Name": "group-id", "Values": [sg["GroupId"]]}
            ]).get("NetworkInterfaces", [])
            groups.append({
                "vpcId": vpc["VpcId"], "groupId": sg["GroupId"],
                "inboundRules": len(sg.get("IpPermissions", [])),
                "outboundRules": len(sg.get("IpPermissionsEgress", [])),
                "attachedNetworkInterfaces": [
                    {"id": e.get("NetworkInterfaceId"), "type": e.get("InterfaceType"),
                     "description": e.get("Description"), "status": e.get("Status")} for e in enis
                ],
            })
    attached = sum(len(g["attachedNetworkInterfaces"]) for g in groups)
    return {"controlId": "EC2.2", "riskScore": min(95, 55 + attached * 8) if attached else 20,
            "recommendation": "REVIEW" if attached else "SAFE_CANDIDATE",
            "defaultSecurityGroups": groups}

def list_failed_findings(c):
    out = []
    pages = c["securityhub"].get_paginator("get_findings").paginate(
        Filters={"ComplianceStatus": [{"Value":"FAILED","Comparison":"EQUALS"}],
                 "RecordState": [{"Value":"ACTIVE","Comparison":"EQUALS"}]},
        PaginationConfig={"MaxItems":100})
    for page in pages:
        for f in page.get("Findings", []):
            out.append({"id": f.get("Id"), "title": f.get("Title"),
                        "severity": f.get("Severity", {}).get("Label"),
                        "resources": [r.get("Id") for r in f.get("Resources", [])]})
    return out

def resp(code, body):
    return {"statusCode": code, "headers": {"content-type":"application/json",
            "access-control-allow-origin":"*"},
            "body": json.dumps(body, ensure_ascii=False, default=str)}

def lambda_handler(event, _context):
    try:
        p = json.loads(event.get("body") or "{}")
        c = clients(assume(p["roleArn"], p.get("externalId","")))
        if p.get("action") == "ec2.2-impact":
            return resp(200, ec2_2_impact(c))
        return resp(200, {"findings": list_failed_findings(c)})
    except KeyError as e:
        return resp(400, {"message": f"missing field: {e}"})
    except Exception as e:
        return resp(500, {"message": str(e)})
