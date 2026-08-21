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
- 고정 이름 실행 Role `AWSSafetyCheckServiceLambdaRole`
- 7일 CloudWatch Logs 보존
- API throttling
- 허용된 웹 Origin 제한
- 고객의 `SafetyCheckReadOnlyRole`만 AssumeRole 가능
- 리소스 인벤토리 조회는 paginator 기반으로 처리
- API 호출은 리전 단위로 분리해 대규모/멀티 리전 계정의 응답 크기를 제어

### 고객 AWS 계정

고객은 `infra/customer-readonly-role.yaml` **하나만** 배포합니다.

가장 간단한 방법은 사이트의 **AWS에 ReadOnly Role 설치** 버튼을 이용하는 것입니다.

1. 사이트가 External ID를 생성합니다.
2. CloudFormation Quick Create 화면을 엽니다.
3. `SafetyCheckAccountId`와 `ExternalId`가 자동 입력됩니다.
4. 스택 `aws-safetycheck-readonly`를 생성합니다.
5. Outputs의 `RoleArn`을 사이트에 붙여넣습니다.
6. 기본 리전 또는 활성 리전 전체를 ReadOnly로 분석합니다.

고객이 API Gateway/Lambda를 별도로 만들거나 Access Key/API Access Token을 브라우저에 입력할 필요가 없습니다.

고객 설치 담당자를 위한 제한 정책은 `infra/customer-installer-policy.json`입니다. 이 정책은 `aws-safetycheck-readonly` 스택과 `SafetyCheckReadOnlyRole`의 설치/업데이트/삭제에 필요한 권한만 제공합니다.

## Trust 정책

고객 Role은 SafetyCheck 운영 계정 전체(root)를 신뢰하지 않습니다.

```text
arn:aws:iam::369503741621:role/AWSSafetyCheckServiceLambdaRole
```

이 **서비스 Lambda Role 하나만** `sts:AssumeRole`할 수 있고, 고객별 External ID가 추가 조건으로 적용됩니다.

## ReadOnly 권한 범위

AWS managed `ReadOnlyAccess`를 통째로 연결하지 않습니다. SafetyCheck는 아키텍처와 보안 분석에 필요한 **메타데이터 조회 API**만 명시적으로 허용합니다.

주요 수집 대상:

- VPC / Subnet / Route / IGW / NAT / VPC Endpoint / SG / ENI / EC2 / EBS
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
- 단일 리전 / 활성 리전 전체 분석
- 주요 Describe/List API paginator 처리
- 주요 AWS 아키텍처 메타데이터 인벤토리
- draw.io `.drawio` 아키텍처 파일 생성
- CloudFormation Quick Create 고객 온보딩
- Chrome 자체 뒤로가기/앞으로가기와 사이트 탭 히스토리 연동

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

서비스별 API에서 확인할 수 없는 애플리케이션 내부 호출 관계는 임의로 연결하지 않습니다.

## 보안 원칙

- Access Key 미사용
- API Access Token 미사용
- 고객 Role은 ReadOnly metadata 권한만 부여
- STS ExternalId 필수
- 고객 Role 이름을 `SafetyCheckReadOnlyRole`로 제한
- 고객 Trust Principal을 SafetyCheck Lambda Role 하나로 제한
- API는 지정된 GitHub Pages Origin만 허용
- API Gateway 요청 속도 제한 적용

> Origin 제한은 사용자 인증을 대체하지 않습니다. 외부 상용 서비스로 확장할 경우 Cognito/OIDC 등 별도 사용자 인증과 고객별 RoleArn 등록/검증을 추가해야 합니다.
