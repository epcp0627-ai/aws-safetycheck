# AWS SafetyCheck MVP

AWS 운영 변경 전에 **장애 위험, 영향 리소스, 비용, 롤백 가능성**을 미리 보여주는 사전 영향 분석 도구입니다.

## 현재 구현

- Security Hub Finding 스타일 대시보드
- EC2.2 / EC2.6 / CloudTrail.2 / CloudTrail.5 / RDS.5 / S3.5 / IAM.3 데모 분석 규칙
- 자연어 기반 간단한 Control 감지
- 위험도 / 비용 / 롤백 / 자동 적용 권장 여부 표시
- 영향 리소스 트리
- 작업 순서 및 작업 계획서 저장
- GitHub Pages 배포 Workflow
- 실제 AWS 연결용 Lambda 골격
- Cross-account ReadOnly Role CloudFormation 템플릿

## 실행

```bash
python -m http.server 8080
```

브라우저에서 `http://localhost:8080`

## 실제 연결 방향

Access Key를 브라우저에 저장하지 않습니다.

Browser → API Gateway → Lambda → STS AssumeRole → 고객 AWS 계정

고객 계정에는 `SafetyCheckReadOnlyRole`만 생성합니다.

## 다음 우선순위

1. EC2.2 실제 ENI 의존성 분석
2. AMI / Launch Template / ASG drift 탐지
3. AMI, EIP, ENI, Security Group 삭제 전 안전 검사
4. CloudTrail.2 KMS Key Policy 사전 검증
5. 작업 계획서 PDF/메일 출력
