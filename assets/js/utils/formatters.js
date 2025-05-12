/**
 * 데이터 포맷팅 유틸리티
 * 다양한 데이터 형식화 기능을 제공합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // formatters 네임스페이스 생성
    window.formatters = {
        /**
         * 날짜 포맷팅
         * 
         * @param {Date|string|number} date - 날짜 객체, 문자열, 타임스탬프
         * @param {string} format - 날짜 포맷 (기본값: 'YYYY-MM-DD')
         * @returns {string} - 포맷팅된 날짜 문자열
         */
        formatDate: function(date, format = 'YYYY-MM-DD') {
            if (!date) return '';
            
            let d;
            
            // Firebase 타임스탬프 처리
            if (date && typeof date === 'object' && date.toDate) {
                d = date.toDate();
            } else if (date && typeof date === 'object' && date.seconds) {
                d = new Date(date.seconds * 1000);
            } else {
                d = new Date(date);
            }
            
            // 날짜가 유효하지 않은 경우
            if (isNaN(d.getTime())) {
                return '';
            }
            
            // 년, 월, 일, 시, 분, 초 구하기
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            
            // 지정된 포맷에 맞게 변환
            let result = format;
            
            result = result.replace('YYYY', year);
            result = result.replace('YY', String(year).slice(-2));
            result = result.replace('MM', month);
            result = result.replace('M', String(d.getMonth() + 1));
            result = result.replace('DD', day);
            result = result.replace('D', String(d.getDate()));
            result = result.replace('HH', hours);
            result = result.replace('H', String(d.getHours()));
            result = result.replace('mm', minutes);
            result = result.replace('m', String(d.getMinutes()));
            result = result.replace('ss', seconds);
            result = result.replace('s', String(d.getSeconds()));
            
            return result;
        },
        
        /**
         * 상대적 시간 포맷팅 (예: '3분 전', '어제')
         * 
         * @param {Date|string|number} date - 날짜 객체, 문자열, 타임스탬프
         * @returns {string} - 상대적 시간 문자열
         */
        formatRelativeTime: function(date) {
            if (!date) return '';
            
            let d;
            
            // Firebase 타임스탬프 처리
            if (date && typeof date === 'object' && date.toDate) {
                d = date.toDate();
            } else if (date && typeof date === 'object' && date.seconds) {
                d = new Date(date.seconds * 1000);
            } else {
                d = new Date(date);
            }
            
            // 날짜가 유효하지 않은 경우
            if (isNaN(d.getTime())) {
                return '';
            }
            
            const now = new Date();
            const diffMs = now - d;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            const diffMonth = Math.floor(diffDay / 30);
            const diffYear = Math.floor(diffDay / 365);
            
            // 미래 날짜 처리
            if (diffMs < 0) {
                const absDiffSec = Math.abs(diffSec);
                const absDiffMin = Math.floor(absDiffSec / 60);
                const absDiffHour = Math.floor(absDiffMin / 60);
                const absDiffDay = Math.floor(absDiffHour / 24);
                const absDiffMonth = Math.floor(absDiffDay / 30);
                const absDiffYear = Math.floor(absDiffDay / 365);
                
                if (absDiffYear > 0) return `${absDiffYear}년 후`;
                if (absDiffMonth > 0) return `${absDiffMonth}개월 후`;
                if (absDiffDay > 0) return `${absDiffDay}일 후`;
                if (absDiffHour > 0) return `${absDiffHour}시간 후`;
                if (absDiffMin > 0) return `${absDiffMin}분 후`;
                return '잠시 후';
            }
            
            // 과거 날짜 처리
            if (diffYear > 0) return `${diffYear}년 전`;
            if (diffMonth > 0) return `${diffMonth}개월 전`;
            if (diffDay > 6) return this.formatDate(d, 'YYYY-MM-DD');
            if (diffDay > 1) return `${diffDay}일 전`;
            if (diffDay === 1) return '어제';
            if (diffHour > 0) return `${diffHour}시간 전`;
            if (diffMin > 0) return `${diffMin}분 전`;
            return '방금 전';
        },
        
        /**
         * 숫자 포맷팅 (천 단위 구분자)
         * 
         * @param {number} number - 포맷팅할 숫자
         * @param {number} decimals - 소수점 자릿수 (기본값: 0)
         * @param {string} decimalPoint - 소수점 구분자 (기본값: '.')
         * @param {string} thousandsSep - 천 단위 구분자 (기본값: ',')
         * @returns {string} - 포맷팅된 숫자 문자열
         */
        formatNumber: function(number, decimals = 0, decimalPoint = '.', thousandsSep = ',') {
            if (number === undefined || number === null) return '';
            
            const num = parseFloat(number);
            
            if (isNaN(num)) {
                return '';
            }
            
            // 소수점 자릿수 제한
            const fixedNum = num.toFixed(decimals);
            
            // 정수 부분과 소수 부분 분리
            const parts = fixedNum.toString().split('.');
            
            // 정수 부분에 천 단위 구분자 추가
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
            
            // 정수 부분과 소수 부분 결합
            return parts.join(decimalPoint);
        },
        
        /**
         * 금액 포맷팅
         * 
         * @param {number} amount - 포맷팅할 금액
         * @param {string} currencySymbol - 통화 기호 (기본값: '₩')
         * @param {number} decimals - 소수점 자릿수 (기본값: 0)
         * @returns {string} - 포맷팅된 금액 문자열
         */
        formatCurrency: function(amount, currencySymbol = '₩', decimals = 0) {
            if (amount === undefined || amount === null) return '';
            
            const num = parseFloat(amount);
            
            if (isNaN(num)) {
                return '';
            }
            
            const formattedNumber = this.formatNumber(num, decimals);
            return `${currencySymbol}${formattedNumber}`;
        },
        
        /**
         * 전화번호 포맷팅
         * 
         * @param {string} phone - 포맷팅할 전화번호
         * @returns {string} - 포맷팅된 전화번호 문자열
         */
        formatPhoneNumber: function(phone) {
            if (!phone) return '';
            
            // 숫자만 추출
            const cleaned = ('' + phone).replace(/\D/g, '');
            
            // 전화번호 길이에 따라 다르게 포맷팅
            if (cleaned.length === 8) {
                // 지역번호 없는 일반 전화번호 (예: 12345678)
                return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
            } else if (cleaned.length === 9) {
                // 2자리 지역번호 (예: 021234567)
                return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
            } else if (cleaned.length === 10) {
                // 일반 전화번호 또는 특수 형태의 휴대폰 번호
                if (cleaned.startsWith('02')) {
                    // 서울 지역번호 (예: 0212345678)
                    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
                } else {
                    // 3자리 지역번호 (예: 0311234567)
                    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                }
            } else if (cleaned.length === 11) {
                // 휴대폰 번호 (예: 01012345678)
                return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
            }
            
            // 정해진 패턴에 맞지 않는 경우, 원래 값 반환
            return phone;
        },
        
        /**
         * 주민등록번호 포맷팅 (보안 처리)
         * 
         * @param {string} idNumber - 포맷팅할 주민등록번호
         * @param {boolean} secure - 뒷자리 보안 처리 여부 (기본값: true)
         * @returns {string} - 포맷팅된 주민등록번호 문자열
         */
        formatIdNumber: function(idNumber, secure = true) {
            if (!idNumber) return '';
            
            // 숫자와 하이픈만 추출
            const cleaned = ('' + idNumber).replace(/[^\d-]/g, '');
            
            // 하이픈 제거
            const digitsOnly = cleaned.replace(/-/g, '');
            
            if (digitsOnly.length !== 13) {
                return idNumber; // 잘못된 형식이면 원래 값 반환
            }
            
            // 앞 6자리와 뒷 7자리 분리
            const front = digitsOnly.substring(0, 6);
            let back = digitsOnly.substring(6, 13);
            
            // 보안 처리 (뒷자리 첫 번째 숫자만 표시하고 나머지는 '*'로 대체)
            if (secure) {
                back = back.substring(0, 1) + '******';
            }
            
            return `${front}-${back}`;
        },
        
        /**
         * 사업자등록번호 포맷팅
         * 
         * @param {string} bizNumber - 포맷팅할 사업자등록번호
         * @returns {string} - 포맷팅된 사업자등록번호 문자열
         */
        formatBusinessNumber: function(bizNumber) {
            if (!bizNumber) return '';
            
            // 숫자만 추출
            const cleaned = ('' + bizNumber).replace(/\D/g, '');
            
            if (cleaned.length !== 10) {
                return bizNumber; // 잘못된 형식이면 원래 값 반환
            }
            
            return cleaned.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
        },
        
        /**
         * 체크박스 선택 항목을 문자열로 포맷팅
         * 
         * @param {Array} checkedItems - 선택된 항목 배열
         * @param {string} separator - 구분자 (기본값: ', ')
         * @returns {string} - 포맷팅된 문자열
         */
        formatCheckedItems: function(checkedItems, separator = ', ') {
            if (!checkedItems || !Array.isArray(checkedItems) || checkedItems.length === 0) {
                return '';
            }
            
            return checkedItems.join(separator);
        },
        
        /**
         * 파일 크기 포맷팅
         * 
         * @param {number} bytes - 바이트 단위 파일 크기
         * @param {number} decimals - 소수점 자릿수 (기본값: 2)
         * @returns {string} - 포맷팅된 파일 크기 문자열
         */
        formatFileSize: function(bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';
            if (!bytes) return '';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
        },
        
        /**
         * 시간 포맷팅 (HH:MM:SS)
         * 
         * @param {number} seconds - 초 단위 시간
         * @returns {string} - 포맷팅된 시간 문자열
         */
        formatTime: function(seconds) {
            if (seconds === undefined || seconds === null) return '';
            
            const sec = parseInt(seconds, 10);
            
            if (isNaN(sec)) {
                return '';
            }
            
            const hours = Math.floor(sec / 3600);
            const minutes = Math.floor((sec % 3600) / 60);
            const remainingSeconds = sec % 60;
            
            // 시, 분, 초를 2자리 숫자로 포맷팅
            const formattedHours = String(hours).padStart(2, '0');
            const formattedMinutes = String(minutes).padStart(2, '0');
            const formattedSeconds = String(remainingSeconds).padStart(2, '0');
            
            // 시간이 있으면 HH:MM:SS, 없으면 MM:SS 형식 반환
            return hours > 0 
                ? `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
                : `${formattedMinutes}:${formattedSeconds}`;
        },
        
        /**
         * 퍼센트 포맷팅
         * 
         * @param {number} value - 포맷팅할 값 (0-1)
         * @param {number} decimals - 소수점 자릿수 (기본값: 0)
         * @returns {string} - 포맷팅된 퍼센트 문자열
         */
        formatPercent: function(value, decimals = 0) {
            if (value === undefined || value === null) return '';
            
            const num = parseFloat(value);
            
            if (isNaN(num)) {
                return '';
            }
            
            // 0-1 범위의 값을 퍼센트로 변환
            const percent = num < 1 ? num * 100 : num;
            
            return `${percent.toFixed(decimals)}%`;
        },
        
        /**
         * 소셜 미디어 수 포맷팅 (예: 1.2k, 3.5M)
         * 
         * @param {number} value - 포맷팅할 값
         * @returns {string} - 포맷팅된 소셜 미디어 수 문자열
         */
        formatSocialNumber: function(value) {
            if (value === undefined || value === null) return '';
            
            const num = parseInt(value, 10);
            
            if (isNaN(num)) {
                return '';
            }
            
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
            }
            
            if (num >= 1000) {
                return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
            }
            
            return num.toString();
        },
        
        /**
         * URL 포맷팅 (프로토콜 추가)
         * 
         * @param {string} url - 포맷팅할 URL
         * @returns {string} - 포맷팅된 URL 문자열
         */
        formatUrl: function(url) {
            if (!url) return '';
            
            // 이미 http:// 또는 https://로 시작하는 경우
            if (/^https?:\/\//i.test(url)) {
                return url;
            }
            
            // 프로토콜 추가
            return 'https://' + url;
        },
        
        /**
         * 이메일 주소 마스킹
         * 
         * @param {string} email - 마스킹할 이메일 주소
         * @returns {string} - 마스킹된 이메일 주소
         */
        maskEmail: function(email) {
            if (!email) return '';
            
            const parts = email.split('@');
            
            if (parts.length !== 2) {
                return email; // 잘못된 이메일 형식
            }
            
            const name = parts[0];
            const domain = parts[1];
            
            // 이름 부분 마스킹 (첫 2자 표시, 나머지 '*'로 대체)
            let maskedName;
            if (name.length <= 2) {
                maskedName = name[0] + '*'.repeat(name.length - 1);
            } else {
                maskedName = name.substring(0, 2) + '*'.repeat(name.length - 2);
            }
            
            return `${maskedName}@${domain}`;
        },
        
        /**
         * HTML 이스케이프 처리
         * 
         * @param {string} text - 이스케이프 처리할 텍스트
         * @returns {string} - 이스케이프 처리된 텍스트
         */
        escapeHtml: function(text) {
            if (!text) return '';
            
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            
            return text.replace(/[&<>"']/g, function(m) { return map[m]; });
        },
        
        /**
         * 문자열 자르기 (말줄임표 추가)
         * 
         * @param {string} text - 자를 텍스트
         * @param {number} maxLength - 최대 길이
         * @param {string} ellipsis - 말줄임표 문자열 (기본값: '...')
         * @returns {string} - 잘린 텍스트
         */
        truncateText: function(text, maxLength, ellipsis = '...') {
            if (!text) return '';
            
            if (text.length <= maxLength) {
                return text;
            }
            
            return text.substring(0, maxLength) + ellipsis;
        },
        
        /**
         * 신용카드 번호 마스킹
         * 
         * @param {string} cardNumber - 마스킹할 카드 번호
         * @returns {string} - 마스킹된 카드 번호
         */
        maskCreditCard: function(cardNumber) {
            if (!cardNumber) return '';
            
            // 공백과 하이픈 제거
            const cleaned = cardNumber.replace(/[\s-]/g, '');
            
            // 카드 번호 길이가 13-19자 범위가 아닌 경우
            if (cleaned.length < 13 || cleaned.length > 19) {
                return cardNumber;
            }
            
            // 첫 6자리와 마지막 4자리를 제외하고 마스킹
            const firstPart = cleaned.substring(0, 6);
            const lastPart = cleaned.substring(cleaned.length - 4);
            const middlePart = '*'.repeat(cleaned.length - 10);
            
            // 4자리마다 공백 추가
            const formatted = (firstPart + middlePart + lastPart).replace(/(.{4})/g, '$1 ').trim();
            
            return formatted;
        },
        
        /**
         * 검색어 하이라이트
         * 
         * @param {string} text - 원본 텍스트
         * @param {string} query - 검색어
         * @param {string} highlightClass - 하이라이트 CSS 클래스 (기본값: 'highlight')
         * @returns {string} - 하이라이트 처리된 HTML
         */
        highlightSearchQuery: function(text, query, highlightClass = 'highlight') {
            if (!text || !query) return text;
            
            // HTML 이스케이프 처리
            const safeText = this.escapeHtml(text);
            const safeQuery = this.escapeHtml(query);
            
            // 대소문자 구분 없이 검색어 하이라이트
            const regex = new RegExp(`(${safeQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
            return safeText.replace(regex, `<span class="${highlightClass}">$1</span>`);
        },
        
        /**
         * 리스트 항목 포맷팅
         * 
         * @param {Array} items - 항목 배열
         * @param {string} type - 리스트 유형 ('bullet', 'number', 'comma')
         * @returns {string} - 포맷팅된 리스트 HTML 또는 문자열
         */
        formatList: function(items, type = 'bullet') {
            if (!items || !Array.isArray(items) || items.length === 0) {
                return '';
            }
            
            switch (type) {
                case 'bullet':
                    return '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>';
                case 'number':
                    return '<ol>' + items.map(item => `<li>${item}</li>`).join('') + '</ol>';
                case 'comma':
                    return items.join(', ');
                default:
                    return items.join('\n');
            }
        },
        
        /**
         * 주소 포맷팅
         * 
         * @param {object} address - 주소 객체
         * @param {string} format - 포맷 형식 ('inline', 'multiline')
         * @returns {string} - 포맷팅된 주소 문자열
         */
        formatAddress: function(address, format = 'inline') {
            if (!address) return '';
            
            const { zipCode, primaryAddress, secondaryAddress, city, state, country } = address;
            
            const parts = [];
            
            if (zipCode) parts.push(zipCode);
            if (city) parts.push(city);
            if (state) parts.push(state);
            if (country) parts.push(country);
            if (primaryAddress) parts.push(primaryAddress);
            if (secondaryAddress) parts.push(secondaryAddress);
            
            if (format === 'multiline') {
                return parts.join('<br>');
            }
            
            return parts.join(' ');
        }
    };
})();