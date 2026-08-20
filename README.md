# AWS SafetyCheck MVP

AWS 운영 변경 전에 **서비스 영향, 장애 위험, 영향 리소스, 비용, 롤백 가능성**을 미리 보여주는 사전 영향 분석 도구입니다.

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
2. `customer-readonly-role.yaml`로 CloudFormation 스택을 생성합니다.
3. 기본 `SafetyCheckAccountId`는 그대로 사용합니다.
4. 스택 출력의 `RoleArn`을 확인합니다.
5. 웹사이트에 `RoleArn + External ID`만 입력합니다.

고객이 API Gateway/Lambda를 별도로 만들거나 Access Key를 브라우저에 입력할 필요가 없습니다.

## 현재 구현

- CIS CSV/JSON 보고서 가져오기
- CIS Finding 한글 설명
- Security Hub Live Finding 조회 지원
- EC2/VPC/SG/ENI/EBS ReadOnly 분석
- RDS 구성 분석
- S3 보안 설정 분석
- CloudTrail 구성 분석
- IAM/Access Analyzer 일부 분석
- 보고서 + 실제 AWS 상태 결합
- Findings의 서비스 영향/비용/위험도 Live 재계산
- GitHub Pages 배포 Workflow

## 보안 원칙

- Access Key 미사용
- 고객 Role은 조회 권한만 부여
- STS ExternalId 필수
- 고객 Role 이름을 `SafetyCheckReadOnlyRole`로 제한
- API는 지정된 GitHub Pages Origin만 허용
- API Gateway 요청 속도 제한 적용

> Origin 제한은 강력한 사용자 인증 수단을 대체하지 않습니다. 외부 상용 서비스로 확장할 경우 Cognito/OIDC 등 별도 사용자 인증을 추가하는 것이 권장됩니다.

## 로컬 실행

```bash
python -m http.server 8080
```

브라우저에서 `http://localhost:8080`
