# AWS SafetyCheck

AWS 운영 변경 전에 **서비스 영향, 장애 위험, 영향 리소스, 비용, 롤백 가능성**을 확인하고 실제 AWS 메타데이터로 아키텍처 구성도를 생성하는 ReadOnly 분석 도구입니다.

## 구조

기본 운영 방식은 **공용 SaaS 백엔드 + 고객 ReadOnly Role**입니다.

```text
GitHub Pages
    ↓
SafetyCheck 운영 AWS
API Gateway → Lambda
    ↓ STS AssumeRole + ExternalId
고객 AWS
SafetyCheckReadOnlyRole
```

### SafetyCheck 운영 계정

운영자가 `infra/service-stack-console.yaml`을 **한 번만** 배포합니다.

- API Gateway
- Lambda
- Lambda 실행 Role
- 7일 CloudWatch Logs 보존
- API throttling
- 허용된 웹 Origin 제한
- `SafetyCheckReadOnlyRole` 이름만 AssumeRole 가능

### 고객 AWS 계정

고객은 `infra/customer-readonly-role.yaml` **하나만** 배포합니다.

1. External ID를 생성합니다.
2. `customer-readonly-role.yaml`로 CloudFormation 스택 `aws-safetycheck-readonly`를 생성합니다.
3. 기본 `SafetyCheckAccountId`는 그대로 사용합니다.
4. 스택 출력의 `RoleArn`을 확인합니다.
5. 웹사이트에 `RoleArn + External ID`만 입력합니다.

고객이 API Gateway/Lambda를 별도로 만들거나 Access Key를 브라우저에 입력할 필요가 없습니다.

고객 설치 담당자를 위한 제한 정책은 `infra/customer-installer-policy.json`입니다. 이 정책은 `aws-safetycheck-readonly` 스택과 `SafetyCheckReadOnlyRole`의 설치/업데이트/삭제에 필요한 권한만 제공합니다.

## ReadOnly 권한 범위

AWS managed `ReadOnlyAccess`를 통째로 연결하지 않습니다. SafetyCheck는 아키텍처와 보안 분석에 필요한 **메타데이터 조회 API**만 명시적으로 허용합니다.

주요 수집 대상:

- VPC / Subnet / Route / IGW / NAT / SG / ENI / EC2 / EBS
- ALB/NLB / Target Group / Auto Scaling
- RDS / ElastiCache / DynamoDB
- S3 / EFS
- CloudFront / Route 53 / WAF / ACM
- Lambda / API Gateway / ECS / EKS
- CloudTrail / CloudWatch
- IAM 보안 메타데이터 / Access Analyzer
- Resource Groups Tagging API 기반 태그 리소스 인벤토리

리소스 생성, 수정, 삭제 API는 고객 Runtime Role에 포함하지 않습니다.

## 현재 구현

- CIS CSV/JSON 보고서 가져오기
- CIS Finding 한글 설명
- Security Hub Live Finding 조회 지원
- 보고서 + 실제 AWS 상태 결합
- Findings의 서비스 영향/비용/위험도 Live 재계산
- 주요 AWS 아키텍처 메타데이터 인벤토리
- draw.io `.drawio` 아키텍처 파일 생성
- GitHub Pages 배포 Workflow

## draw.io 아키텍처 출력

ReadOnly 연결 후 사이트의 **아키텍처** 탭에서 `.drawio` 파일을 생성할 수 있습니다.

- draw.io AWS4 서비스 아이콘 사용
- VPC / Subnet 기준 자동 배치
- CloudFront → Origin
- WAF → CloudFront
- Load Balancer → Target Group → EC2
- Auto Scaling Group → EC2
- CloudTrail → S3
- 애플리케이션 내부 호출 관계는 추정하지 않음
- 생성 파일은 diagrams.net/draw.io에서 직접 편집 가능

태그 인벤토리는 태그가 있는 리소스만 포괄적으로 잡을 수 있으므로 **모든 AWS 서비스의 모든 리소스를 100% 보장하는 기능은 아닙니다.** 주요 아키텍처 서비스는 서비스별 Describe/List API로 별도 수집합니다.

## 보안 원칙

- Access Key 미사용
- 고객 Role은 ReadOnly metadata 권한만 부여
- STS ExternalId 필수
- 고객 Role 이름을 `SafetyCheckReadOnlyRole`로 제한
- API는 지정된 GitHub Pages Origin만 허용
- API Gateway 요청 속도 제한 적용

> Origin 제한은 강력한 사용자 인증 수단을 대체하지 않습니다. 외부 상용 서비스로 확장할 경우 Cognito/OIDC 등 별도 사용자 인증을 추가하는 것이 권장됩니다.
