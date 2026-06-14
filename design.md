# Blog Design Theme & Concept

이 문서는 깃허브 블로그에 적용된 디자인 테마의 컬러 팔레트와 디자인 컨셉을 정리한 문서입니다.

## 1. 디자인 컨셉 (Design Concept)

- **Minimalist & Clean**: 복잡한 장식을 배제하고 핵심 콘텐츠에 집중할 수 있는 깔끔한 레이아웃을 제공합니다.
- **Vibrant Accent**: 기본적으로 화이트 배경을 사용하되, 포인트 컬러 `#ffce00`을 활용해 생동감과 시각적 포인트를 줍니다.
- **Glassmorphism & Soft Shadows**: 네비게이션 바와 일부 카드 컴포넌트에 미세한 블러 효과와 부드러운 그림자를 주어 깊이감(Depth)과 세련된 느낌을 제공합니다.
- **Micro-interactions**: 버튼 호버, 카드 스케일링, 페이지 전환 시 부드러운 트랜지션 애니메이션을 적용해 생동감 있는 인터랙션을 지원합니다.

## 2. 컬러 팔레트 (Color Palette)

블로그 전반에 사용된 색상 체계는 다음과 같습니다.

| 역할 | 색상 이름 | Hex 코드 | 설명 |
| :--- | :--- | :--- | :--- |
| **Primary (Point)** | Sun Yellow | `#ffce00` | 네이게이션 바 강조, 호버 상태, 포인트 버튼 |
| **Primary Hover** | Warm Gold | `#e6b800` | 포인트 컬러의 호버/활성화 상태 색상 |
| **Background (Main)** | Pure White | `#ffffff` | 블로그 기본 배경색 |
| **Background (Alt)** | Off-White / Light Gray | `#f8fafc` | 프로필 카드, 에디터 영역, 태그 등 보조 배경색 |
| **Text (Primary)** | Dark Slate | `#0f172a` | 메인 타이틀, 본문 텍스트 (높은 가독성) |
| **Text (Secondary)** | Medium Gray | `#64748b` | 작성일, 카테고리, 설명글 등 보조 텍스트 |
| **Border / Divider** | Cool Gray | `#e2e8f0` | 컴포넌트 경계선 및 분할선 |

## 3. 타이포그래피 (Typography)

- **Main Heading & Accent Font**: `Outfit` (sans-serif) - 현대적이고 둥글면서도 신뢰감을 주는 고딕 계열 폰트
- **Body Font**: `Inter` (sans-serif) - 긴 글을 읽을 때도 가독성이 높은 고품질 산세리프 폰트
- **Code Font**: `JetBrains Mono` / `Fira Code` (monospace) - 개발용 코드 가독성을 극대화한 고정폭 폰트

## 4. 레이아웃 가이드 (Layout Guide)

블로그는 3단 컬럼 그리드 시스템을 기반으로 구성됩니다.

1. **상단 네비게이션바 (Navigation Bar)**:
   - 고정(Fixed) 및 상단 위치.
   - 로고, 메뉴 탭, 검색창, '글쓰기' 버튼 포함.
2. **좌측 프로필 & 사이드바 (Profile & Sidebar)**:
   - 프로필 이미지, 닉네임, 한 줄 소개.
   - 소셜 네트워크 링크 아이콘 및 카테고리/태그 목록.
3. **가운데 메인 콘텐츠 (Main Content)**:
   - 라우팅 상태에 따라 게시글 목록, 상세 페이지, 게시글 작성 페이지로 가변 전환.
4. **우측 목차 (TOC - Table of Contents)**:
   - 현재 조회 중인 게시글의 제목 구조(H1, H2, H3)를 파싱하여 스크롤에 맞춰 유기적으로 실시간 하이라이트.
