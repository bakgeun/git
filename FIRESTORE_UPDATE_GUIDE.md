# Firestore 강사 데이터 업데이트 가이드

## 📍 Firebase Console 접속
https://console.firebase.google.com/project/digital-healthcare-cente-2204b/firestore

## 🎯 컬렉션: instructors

각 강사는 별도의 문서(Document)로 저장됩니다.

---

## 강사 1: 노호성 교수

**문서 ID**: `instructor1` (또는 자동 ID)

### 필드:
```
name (string): "노호성 교수"
photoUrl (string): "../../assets/images/instructors/instructor1.jpg"
specialties (array): ["health-exercise"]
position (string): "한양대학교 예술체육대학 겸임교수"
description (string): ""
education (string): "Univ. of Tsukuba, Japan 체육과학박사"
career (string): "전) 경희대학교 체육대학 교수
현) 대한걷기연맹 부회장
현) 국제항노화협회 부회장
현) 한양대학교 예술체육대학 겸임교수"
active (boolean): true
order (number): 1
```

---

## 강사 2: 박재활 교수

**문서 ID**: `instructor2` (또는 자동 ID)

### 필드:
```
name (string): "박재활 교수"
photoUrl (string): "../../assets/images/instructors/instructor2.jpg"
specialties (array): ["rehabilitation"]
position (string): "중앙대학교 스포츠의학과 교수"
description (string): ""
education (string): "Univ. of Tsukuba, Japan 체육과학박사"
career (string): "전) 경희대학교 체육대학 교수
현) 대한걷기연맹 부회장
현) 국제항노화협회 부회장
현) 한양대학교 예술체육대학 겸임교수"
active (boolean): true
order (number): 2
```

---

## 강사 3: 박민선 교수

**문서 ID**: `instructor3` (또는 자동 ID)

### 필드:
```
name (string): "박민선 교수"
photoUrl (string): "../../assets/images/instructors/instructor3.png"
specialties (array): ["pilates"]
position (string): "건국대학교 산업대학원 재활필라테스 외래교수"
description (string): ""
education (string): "New York Univ. 무용석사 / 충남대학교 무용학 박사"
career (string): "현) 더코어 대표원장
현) 한국무용예술학회 이사
현) 구제예술심리치료학회 이사
현) 코어닷에이 인터넷 강의 및 온라인 몰 대표원장
현) 닥터리켐 회복필라테스 대표원장
현) 건국대학교 산업대학원 스포츠융합산업학과 강사"
active (boolean): true
order (number): 3
```

---

## 강사 4: 박신언 교수

**문서 ID**: `instructor4` (또는 자동 ID)

### 필드:
```
name (string): "박신언 교수"
photoUrl (string): "../../assets/images/instructors/instructor4.jpg"
specialties (array): ["recreation"]
position (string): "화성의과학대학교 스포츠과학과 교수"
description (string): ""
education (string): "경희대학교 체육학박사"
career (string): "현) 화성의과학대학교 스포츠과학과 교수
현) 국민체육진흥공단 기금평가 위원
현) 한국 스포츠 사회학회 이사
현) 국제학술지 Journal of Men's Health (SSCI) 편집위원
현) 국제학술지 'BMC Psychology' (SSCI) 편집위원"
active (boolean): true
order (number): 4
```

---

## 🔑 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| **name** | string | 강사 이름 (예: "노호성 교수") |
| **photoUrl** | string | 프로필 사진 경로 |
| **specialties** | array | 전문 분야 (health-exercise, rehabilitation, pilates, recreation) |
| **position** | string | 현재 주요 직책 (첫 번째 줄에 표시됨) |
| **description** | string | 전문 분야 상세 설명 (비워둠) |
| **education** | string | 학력 정보 |
| **career** | string | 경력 정보 (줄바꿈으로 구분) |
| **active** | boolean | 활성화 여부 (true = 표시, false = 숨김) |
| **order** | number | 정렬 순서 (1, 2, 3, 4...) |

---

## 📋 입력 방법

### Firebase Console에서:

1. **Firestore Database** → **instructors** 컬렉션 선택
2. **문서 추가** 또는 기존 문서 수정
3. 각 필드를 **정확한 타입**으로 입력:
   - `name`: **string** 타입
   - `specialties`: **array** 타입
   - `active`: **boolean** 타입
   - `order`: **number** 타입
   - 나머지: **string** 타입

4. **career 필드 입력 시 주의**:
   - 여러 줄로 입력할 때는 `Shift + Enter`로 줄바꿈
   - 또는 Firebase Console에서 직접 줄바꿈 입력

---

## ✅ 업데이트 후 확인 사항

1. ✅ 모든 강사의 `active` 필드가 `true`인지 확인
2. ✅ `order` 필드가 1, 2, 3, 4로 올바르게 설정되었는지 확인
3. ✅ `specialties` 배열에 올바른 값이 들어갔는지 확인
   - `health-exercise` (운동건강관리사)
   - `rehabilitation` (스포츠헬스케어지도자)
   - `pilates` (필라테스)
   - `recreation` (레크리에이션)

---

## 🎨 과정 배지 자동 매칭

JavaScript가 `specialties` 값에 따라 자동으로 배지를 표시합니다:

| specialties 값 | 표시되는 배지 |
|----------------|---------------|
| health-exercise | 운동건강관리사 과정 (파란색) |
| rehabilitation | 스포츠헬스케어지도자 과정 (핑크색) |
| pilates | 필라테스 전문가 과정 (보라색) |
| recreation | 레크리에이션 지도자 과정 (녹색) |
