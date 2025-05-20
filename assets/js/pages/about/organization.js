// organization.js - 조직도 페이지 전용 JavaScript

// 페이지 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 조직도 애니메이션 초기화
    initOrganizationChart();
    
    // 스크롤 애니메이션 초기화
    initScrollAnimations();
    
    // 조직도 노드 인터랙션 초기화
    initNodeInteractions();
    
    // 기관장 사진 슬라이드 쇼 초기화 (옵션)
    initDirectorSlideshow();
    
    // 부서별 세부 정보 토글 초기화
    initDepartmentToggle();
});

// 조직도 애니메이션 초기화
function initOrganizationChart() {
    const nodes = document.querySelectorAll('.org-node');
    
    // 초기에는 모든 노드를 숨김
    nodes.forEach(node => {
        node.style.opacity = '0';
        node.style.transform = 'translateY(30px)';
    });
    
    // 순차적으로 노드 표시
    setTimeout(() => {
        nodes.forEach((node, index) => {
            setTimeout(() => {
                node.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                node.style.opacity = '1';
                node.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }, 300);
}

// 스크롤 애니메이션 초기화
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 부서별 세부 정보 카드 애니메이션
                if (entry.target.classList.contains('department-detail-card')) {
                    animateDepartmentCard(entry.target);
                }
                
                // 운영 원칙 카드 애니메이션
                if (entry.target.classList.contains('principle-card')) {
                    animatePrincipleCard(entry.target);
                }
                
                // 기본 페이드 인 애니메이션
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 관찰할 요소들 등록
    const animatedElements = document.querySelectorAll('.department-detail-card, .principle-card, .contact-info-section');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// 조직도 노드 인터랙션 초기화
function initNodeInteractions() {
    const nodes = document.querySelectorAll('.org-node');
    
    nodes.forEach(node => {
        // 클릭 이벤트 - 노드 정보 표시
        node.addEventListener('click', function() {
            const nodeTitle = this.querySelector('.node-title').textContent;
            const nodeName = this.querySelector('.node-name').textContent;
            
            showNodeInfo(nodeTitle, nodeName);
        });
        
        // 호버 효과 강화
        node.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.05)';
            this.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.15)';
        });
        
        node.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
        });
    });
}

// 노드 정보 표시 함수
function showNodeInfo(title, name) {
    // 모달 또는 툴팁 형태로 정보 표시
    const info = getNodeDetailInfo(title);
    
    // 간단한 알림으로 표시 (실제 구현에서는 모달 사용 권장)
    if (info) {
        alert(`${title}\n${name}\n\n${info}`);
    }
}

// 노드별 상세 정보
function getNodeDetailInfo(title) {
    const infoMap = {
        '기관장': '전체 조직의 총괄 책임을 맡으며, 기관의 전략적 방향을 설정합니다.',
        '부센터장': '기관장을 보좌하며, 각 부서 간의 조정 역할을 담당합니다.',
        '교육부': '교육과정 개발, 강의 운영, 콘텐츠 제작을 담당합니다.',
        '평가부': '자격증 시험 출제, 평가 기준 설정, 자격증 발급을 담당합니다.',
        '기획부': '중장기 계획 수립, 연구개발, 국제협력을 담당합니다.',
        '운영부': '재무, 시설, 인사, IT 운영을 담당합니다.'
    };
    
    return infoMap[title] || null;
}

// 기관장 사진 슬라이드 쇼 (옵션)
function initDirectorSlideshow() {
    const directorPhotos = [
        '../../assets/images/organization/director1.jpg',
        '../../assets/images/organization/director2.jpg',
        '../../assets/images/organization/director3.jpg'
    ];
    
    const photoElement = document.querySelector('.director-photo img');
    
    if (photoElement && directorPhotos.length > 1) {
        let currentIndex = 0;
        
        setInterval(() => {
            currentIndex = (currentIndex + 1) % directorPhotos.length;
            
            // 페이드 아웃
            photoElement.style.opacity = '0';
            
            setTimeout(() => {
                photoElement.src = directorPhotos[currentIndex];
                // 페이드 인
                photoElement.style.opacity = '1';
            }, 300);
        }, 5000);
    }
}

// 부서별 세부 정보 토글
function initDepartmentToggle() {
    const departmentCards = document.querySelectorAll('.department-detail-card');
    
    departmentCards.forEach(card => {
        const header = card.querySelector('.card-header');
        const content = card.querySelector('.card-content');
        
        // 초기 상태 설정
        card.classList.add('collapsed');
        content.style.maxHeight = '0';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 0.3s ease';
        
        header.addEventListener('click', function() {
            if (card.classList.contains('collapsed')) {
                // 확장
                card.classList.remove('collapsed');
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                // 축소
                card.classList.add('collapsed');
                content.style.maxHeight = '0';
            }
        });
    });
}

// 부서 카드 애니메이션
function animateDepartmentCard(card) {
    const header = card.querySelector('.card-header');
    const content = card.querySelector('.card-content');
    
    header.style.transform = 'translateY(-20px)';
    header.style.opacity = '0';
    content.style.transform = 'translateY(20px)';
    content.style.opacity = '0';
    
    setTimeout(() => {
        header.style.transition = 'all 0.5s ease';
        header.style.transform = 'translateY(0)';
        header.style.opacity = '1';
    }, 100);
    
    setTimeout(() => {
        content.style.transition = 'all 0.5s ease';
        content.style.transform = 'translateY(0)';
        content.style.opacity = '1';
    }, 200);
}

// 운영 원칙 카드 애니메이션
function animatePrincipleCard(card) {
    const icon = card.querySelector('.principle-icon');
    const title = card.querySelector('h4');
    const description = card.querySelector('p');
    
    icon.style.transform = 'scale(0) rotate(180deg)';
    icon.style.opacity = '0';
    title.style.transform = 'translateX(-30px)';
    title.style.opacity = '0';
    description.style.transform = 'translateY(20px)';
    description.style.opacity = '0';
    
    setTimeout(() => {
        icon.style.transition = 'all 0.5s ease';
        icon.style.transform = 'scale(1) rotate(0deg)';
        icon.style.opacity = '1';
    }, 100);
    
    setTimeout(() => {
        title.style.transition = 'all 0.5s ease';
        title.style.transform = 'translateX(0)';
        title.style.opacity = '1';
    }, 200);
    
    setTimeout(() => {
        description.style.transition = 'all 0.5s ease';
        description.style.transform = 'translateY(0)';
        description.style.opacity = '1';
    }, 300);
}

// 조직도 요소 강조 기능
function highlightNode(nodeClass) {
    const nodes = document.querySelectorAll('.org-node');
    const targetNode = document.querySelector(`.${nodeClass}`);
    
    // 모든 노드 흐리게
    nodes.forEach(node => {
        node.style.opacity = '0.3';
    });
    
    // 선택된 노드 강조
    if (targetNode) {
        targetNode.style.opacity = '1';
        targetNode.style.transform = 'scale(1.1)';
        targetNode.style.zIndex = '10';
    }
    
    // 3초 후 원상복구
    setTimeout(() => {
        nodes.forEach(node => {
            node.style.opacity = '1';
            node.style.transform = 'scale(1)';
            node.style.zIndex = 'auto';
        });
    }, 3000);
}

// 부서별 연락처 검색 기능
function initContactSearch() {
    const searchInput = document.querySelector('#contact-search');
    const tableRows = document.querySelectorAll('.contact-table tbody tr');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            tableRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
                
                if (rowText.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

// 인쇄용 조직도 생성
function generatePrintableChart() {
    const chart = document.querySelector('.org-chart-container');
    
    if (chart) {
        // 새 창에서 인쇄 페이지 생성
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>디지털헬스케어센터 조직도</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .org-chart-container { transform: scale(0.8); transform-origin: top left; }
                        @media print { 
                            body { margin: 0; }
                            .org-chart-container { transform: scale(0.7); }
                        }
                    </style>
                </head>
                <body>
                    <h1>사&rpar;문경 부설 디지털헬스케어센터 조직도</h1>
                    ${chart.outerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// 유틸리티 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// about.css 와 함께 사용할 JavaScript (선택사항)
function scrollActiveTabIntoView() {
    const activeTab = document.querySelector('.navigation-tabs .tab-item.active');
    if (activeTab && window.innerWidth <= 768) {
        const container = document.querySelector('.navigation-tabs nav');
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        
        // 탭을 화면 중앙에 위치시키기
        const scrollLeft = container.scrollLeft + 
            tabRect.left - containerRect.left - 
            (containerRect.width / 2) + (tabRect.width / 2);
        
        container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', scrollActiveTabIntoView);
// 화면 크기 변경 시 실행
window.addEventListener('resize', scrollActiveTabIntoView);