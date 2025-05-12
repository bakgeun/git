/**
 * 푸터 컴포넌트
 * 웹사이트 하단 푸터 관련 기능
 */

(function() {
    'use strict';

    window.Footer = {
        /**
         * 푸터 초기화
         */
        init: function() {
            this.setupEventListeners();
            this.updateCopyright();
            this.loadFooterContent();
            this.setupScrollToTop();
            this.trackFooterLinks();
        },

        /**
         * 이벤트 리스너 설정
         */
        setupEventListeners: function() {
            // 뉴스레터 구독 폼
            const newsletterForm = document.getElementById('newsletter-form');
            if (newsletterForm) {
                newsletterForm.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));
            }

            // 푸터 링크 클릭 이벤트
            const footerLinks = document.querySelectorAll('.footer-link');
            footerLinks.forEach(link => {
                link.addEventListener('click', (e) => this.handleFooterLinkClick(e));
            });

            // 소셜 미디어 링크
            const socialLinks = document.querySelectorAll('.social-link');
            socialLinks.forEach(link => {
                link.addEventListener('click', (e) => this.handleSocialLinkClick(e));
            });
        },

        /**
         * 저작권 연도 업데이트
         */
        updateCopyright: function() {
            const copyrightYear = document.getElementById('copyright-year');
            if (copyrightYear) {
                copyrightYear.textContent = new Date().getFullYear();
            }
        },

        /**
         * 동적 푸터 콘텐츠 로드
         */
        loadFooterContent: async function() {
            try {
                // 최근 공지사항 로드
                const recentNotices = await this.loadRecentNotices();
                this.renderRecentNotices(recentNotices);

                // 인기 자격증 정보 로드
                const popularCertificates = await this.loadPopularCertificates();
                this.renderPopularCertificates(popularCertificates);

                // 연락처 정보 업데이트
                const contactInfo = await this.loadContactInfo();
                this.updateContactInfo(contactInfo);
            } catch (error) {
                console.error('푸터 콘텐츠 로드 오류:', error);
            }
        },

        /**
         * 최근 공지사항 로드
         */
        loadRecentNotices: async function() {
            try {
                const result = await dbService.getDocuments('board_notice', {
                    where: [{ field: 'status', operator: '==', value: 'published' }],
                    orderBy: { field: 'createdAt', direction: 'desc' },
                    limit: 3
                });

                return result.success ? result.data : [];
            } catch (error) {
                console.error('최근 공지사항 로드 오류:', error);
                return [];
            }
        },

        /**
         * 최근 공지사항 렌더링
         */
        renderRecentNotices: function(notices) {
            const container = document.getElementById('footer-recent-notices');
            if (!container) return;

            if (notices.length === 0) {
                container.innerHTML = '<p class="text-gray-400">최근 공지사항이 없습니다.</p>';
                return;
            }

            const html = notices.map(notice => `
                <li>
                    <a href="/pages/board/notice/view.html?id=${notice.id}" 
                       class="text-gray-400 hover:text-white transition-colors">
                        ${notice.title}
                    </a>
                </li>
            `).join('');

            container.innerHTML = html;
        },

        /**
         * 인기 자격증 정보 로드
         */
        loadPopularCertificates: async function() {
            // 실제로는 통계 데이터를 기반으로 인기 자격증을 조회
            // 여기서는 하드코딩된 데이터 반환
            return [
                { id: 'health-exercise', name: '건강운동처방사', count: 150 },
                { id: 'pilates', name: '필라테스 전문가', count: 120 },
                { id: 'rehabilitation', name: '운동재활전문가', count: 100 }
            ];
        },

        /**
         * 인기 자격증 렌더링
         */
        renderPopularCertificates: function(certificates) {
            const container = document.getElementById('footer-popular-certificates');
            if (!container) return;

            const html = certificates.map(cert => `
                <li>
                    <a href="/pages/certificate/${cert.id}.html" 
                       class="text-gray-400 hover:text-white transition-colors">
                        ${cert.name}
                    </a>
                </li>
            `).join('');

            container.innerHTML = html;
        },

        /**
         * 연락처 정보 로드
         */
        loadContactInfo: async function() {
            // 실제로는 Firestore에서 연락처 정보를 로드
            // 여기서는 하드코딩된 데이터 반환
            return {
                address: '서울특별시 강남구 테헤란로 123',
                phone: '02-1234-5678',
                email: 'info@digitalhealthcare.org',
                hours: '평일 09:00 - 18:00'
            };
        },

        /**
         * 연락처 정보 업데이트
         */
        updateContactInfo: function(info) {
            const elements = {
                address: document.getElementById('footer-address'),
                phone: document.getElementById('footer-phone'),
                email: document.getElementById('footer-email'),
                hours: document.getElementById('footer-hours')
            };

            Object.keys(elements).forEach(key => {
                if (elements[key] && info[key]) {
                    elements[key].textContent = info[key];
                }
            });
        },

        /**
         * 뉴스레터 구독 처리
         */
        handleNewsletterSubmit: async function(event) {
            event.preventDefault();
            const form = event.target;
            const email = form.querySelector('input[type="email"]').value;

            try {
                // 이메일 유효성 검사
                if (!validators.isValidEmail(email)) {
                    throw new Error('올바른 이메일 주소를 입력해주세요.');
                }

                // 구독 처리
                const result = await this.subscribeNewsletter(email);
                
                if (result.success) {
                    this.showNotification('뉴스레터 구독이 완료되었습니다.', 'success');
                    form.reset();
                } else {
                    throw new Error(result.error || '구독 처리 중 오류가 발생했습니다.');
                }
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        },

        /**
         * 뉴스레터 구독 API 호출
         */
        subscribeNewsletter: async function(email) {
            try {
                // Firebase Functions 또는 외부 API 호출
                const result = await apiService.post('/api/newsletter/subscribe', { email });
                return result;
            } catch (error) {
                console.error('뉴스레터 구독 오류:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * 푸터 링크 클릭 처리
         */
        handleFooterLinkClick: function(event) {
            const link = event.currentTarget;
            const href = link.getAttribute('href');
            
            // 외부 링크인 경우 새 창에서 열기
            if (href.startsWith('http') && !href.includes(window.location.hostname)) {
                event.preventDefault();
                window.open(href, '_blank', 'noopener,noreferrer');
            }

            // 분석 이벤트 전송
            this.trackEvent('footer_link_click', {
                link_text: link.textContent.trim(),
                link_url: href
            });
        },

        /**
         * 소셜 미디어 링크 클릭 처리
         */
        handleSocialLinkClick: function(event) {
            const link = event.currentTarget;
            const platform = link.dataset.platform || link.getAttribute('aria-label');
            
            // 분석 이벤트 전송
            this.trackEvent('social_link_click', {
                platform: platform,
                url: link.href
            });
        },

        /**
         * 맨 위로 스크롤 버튼 설정
         */
        setupScrollToTop: function() {
            const scrollToTopBtn = document.getElementById('scroll-to-top');
            if (!scrollToTopBtn) return;

            // 스크롤 이벤트 리스너
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    scrollToTopBtn.classList.remove('hidden');
                    scrollToTopBtn.classList.add('show');
                } else {
                    scrollToTopBtn.classList.remove('show');
                    scrollToTopBtn.classList.add('hidden');
                }
            });

            // 클릭 이벤트 리스너
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                
                this.trackEvent('scroll_to_top_click');
            });
        },

        /**
         * 푸터 링크 추적
         */
        trackFooterLinks: function() {
            // 푸터 내의 모든 링크에 대한 추적 설정
            const footer = document.querySelector('footer');
            if (!footer) return;

            footer.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link) {
                    const section = link.closest('.footer-section')?.dataset.section || 'unknown';
                    this.trackEvent('footer_navigation', {
                        section: section,
                        link_text: link.textContent.trim(),
                        link_url: link.href
                    });
                }
            });
        },

        /**
         * 이벤트 추적
         */
        trackEvent: function(eventName, eventData = {}) {
            // Google Analytics 또는 기타 분석 도구로 이벤트 전송
            if (window.gtag) {
                window.gtag('event', eventName, eventData);
            }
            
            // 개발 모드에서는 콘솔에 로그
            if (window.location.hostname === 'localhost') {
                console.log('Footer Event:', eventName, eventData);
            }
        },

        /**
         * 알림 표시
         */
        showNotification: function(message, type = 'info') {
            // 기존 알림 제거
            const existingNotification = document.querySelector('.footer-notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            // 새 알림 생성
            const notification = document.createElement('div');
            notification.className = `footer-notification ${type}`;
            notification.textContent = message;

            // 푸터 상단에 삽입
            const footer = document.querySelector('footer');
            if (footer) {
                footer.insertBefore(notification, footer.firstChild);
                
                // 3초 후 제거
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            }
        },

        /**
         * 푸터 데이터 새로고침
         */
        refresh: function() {
            this.loadFooterContent();
        },

        /**
         * 푸터 상태 초기화
         */
        reset: function() {
            // 뉴스레터 폼 초기화
            const newsletterForm = document.getElementById('newsletter-form');
            if (newsletterForm) {
                newsletterForm.reset();
            }

            // 알림 제거
            const notifications = document.querySelectorAll('.footer-notification');
            notifications.forEach(notification => notification.remove());
        },

        /**
         * 모바일 푸터 메뉴 토글
         */
        toggleMobileMenu: function(section) {
            const menuContent = document.querySelector(`.footer-mobile-menu[data-section="${section}"]`);
            if (!menuContent) return;

            const isExpanded = menuContent.classList.contains('expanded');
            
            // 모든 메뉴 닫기
            document.querySelectorAll('.footer-mobile-menu').forEach(menu => {
                menu.classList.remove('expanded');
            });

            // 선택한 메뉴 토글
            if (!isExpanded) {
                menuContent.classList.add('expanded');
            }

            this.trackEvent('footer_mobile_menu_toggle', {
                section: section,
                action: isExpanded ? 'close' : 'open'
            });
        }
    };

    // DOMContentLoaded 이벤트에서 초기화
    document.addEventListener('DOMContentLoaded', function() {
        Footer.init();
    });

    // 전역 객체에 Footer 추가
    window.Footer = Footer;
})();