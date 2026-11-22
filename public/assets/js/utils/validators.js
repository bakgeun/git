/**
 * 유효성 검사 유틸리티
 * 다양한 입력 데이터에 대한 유효성 검사 함수들을 제공합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // validators 네임스페이스 생성
    window.validators = {
        /**
         * 이메일 유효성 검사
         * 
         * @param {string} email - 검사할 이메일 주소
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidEmail: function(email) {
            if (!email) return false;
            
            // 이메일 정규식 패턴
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailPattern.test(email);
        },
        
         /**
         * 비밀번호 유효성 검사
         * 최소 8자, 문자와 숫자 조합 필수
         * 
         * @param {string} password - 검사할 비밀번호
         * @param {object} options - 추가 검사 옵션
         * @returns {object} - 유효성 검사 결과 및 오류 메시지
         */
        validatePassword: function(password, options = {}) {
            const defaultOptions = {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: false
            };
            
            const mergedOptions = { ...defaultOptions, ...options };
            const errors = [];
            
            // 길이 검사
            if (!password || password.length < mergedOptions.minLength) {
                errors.push(`비밀번호는 최소 ${mergedOptions.minLength}자 이상이어야 합니다.`);
            }
            
            // 대문자 포함 검사
            if (mergedOptions.requireUppercase && !/[A-Z]/.test(password)) {
                errors.push('비밀번호에는 적어도 하나의 대문자가 포함되어야 합니다.');
            }
            
            // 소문자 포함 검사
            if (mergedOptions.requireLowercase && !/[a-z]/.test(password)) {
                errors.push('비밀번호에는 적어도 하나의 소문자가 포함되어야 합니다.');
            }
            
            // 숫자 포함 검사
            if (mergedOptions.requireNumbers && !/[0-9]/.test(password)) {
                errors.push('비밀번호에는 적어도 하나의 숫자가 포함되어야 합니다.');
            }
            
            // 특수 문자 포함 검사
            if (mergedOptions.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                errors.push('비밀번호에는 적어도 하나의 특수 문자가 포함되어야 합니다.');
            }
            
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        },
        
        /**
         * 전화번호 유효성 검사
         * 
         * @param {string} phone - 검사할 전화번호
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidPhone: function(phone) {
            if (!phone) return false;
            
            // 전화번호 정규식 패턴 (한국 전화번호 형식)
            const phonePattern = /^(01[016789])-?([0-9]{3,4})-?([0-9]{4})$/;
            return phonePattern.test(phone);
        },
        
        /**
         * 주민등록번호 유효성 검사
         * 
         * @param {string} idNumber - 검사할 주민등록번호 (앞 6자리-뒤 7자리)
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidIdNumber: function(idNumber) {
            if (!idNumber) return false;
            
            // 주민번호 정규식 패턴
            const idPattern = /^(\d{6})-?(\d{7})$/;
            
            if (!idPattern.test(idNumber)) {
                return false;
            }
            
            // 하이픈 제거
            const cleanId = idNumber.replace(/-/g, '');
            
            // 주민등록번호 체크섬 검증
            const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
            let sum = 0;
            
            for (let i = 0; i < 12; i++) {
                sum += parseInt(cleanId.charAt(i)) * weights[i];
            }
            
            const checkDigit = (11 - (sum % 11)) % 10;
            return parseInt(cleanId.charAt(12)) === checkDigit;
        },
        
        /**
         * 사업자등록번호 유효성 검사
         * 
         * @param {string} bizNumber - 검사할 사업자등록번호 (XXX-XX-XXXXX)
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidBusinessNumber: function(bizNumber) {
            if (!bizNumber) return false;
            
            // 사업자번호 정규식 패턴
            const bizPattern = /^(\d{3})-?(\d{2})-?(\d{5})$/;
            
            if (!bizPattern.test(bizNumber)) {
                return false;
            }
            
            // 하이픈 제거
            const cleanBiz = bizNumber.replace(/-/g, '');
            
            // 사업자등록번호 체크섬 검증
            const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
            let sum = 0;
            
            for (let i = 0; i < 9; i++) {
                sum += parseInt(cleanBiz.charAt(i)) * weights[i];
            }
            
            sum += parseInt(cleanBiz.charAt(8)) * 5 / 10;
            const checkDigit = (10 - (sum % 10)) % 10;
            
            return parseInt(cleanBiz.charAt(9)) === checkDigit;
        },
        
        /**
         * 우편번호 유효성 검사
         * 
         * @param {string} postalCode - 검사할 우편번호
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidPostalCode: function(postalCode) {
            if (!postalCode) return false;
            
            // 우편번호 정규식 패턴 (5자리 한국 우편번호)
            const postalPattern = /^\d{5}$/;
            return postalPattern.test(postalCode);
        },
        
        /**
         * 날짜 유효성 검사
         * 
         * @param {string} dateStr - 검사할 날짜 문자열 (YYYY-MM-DD)
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidDate: function(dateStr) {
            if (!dateStr) return false;
            
            // 날짜 정규식 패턴
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;
            
            if (!datePattern.test(dateStr)) {
                return false;
            }
            
            // 날짜 객체로 변환하여 유효성 검사
            const date = new Date(dateStr);
            
            if (isNaN(date.getTime())) {
                return false;
            }
            
            // 입력한 날짜와 Date 객체의 구성 요소 비교
            const parts = dateStr.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // 월은 0부터 시작
            const day = parseInt(parts[2], 10);
            
            return date.getFullYear() === year && 
                   date.getMonth() === month && 
                   date.getDate() === day;
        },
        
        /**
         * URL 유효성 검사
         * 
         * @param {string} url - 검사할 URL
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidURL: function(url) {
            if (!url) return false;
            
            try {
                new URL(url);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        /**
         * 신용카드 번호 유효성 검사
         * 
         * @param {string} cardNumber - 검사할 신용카드 번호
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidCreditCard: function(cardNumber) {
            if (!cardNumber) return false;
            
            // 공백과 하이픈 제거
            const cleanNumber = cardNumber.replace(/[\s-]/g, '');
            
            // 숫자만 포함되어 있는지 확인
            if (!/^\d+$/.test(cleanNumber)) {
                return false;
            }
            
            // 길이 확인 (대부분의 카드는 13-19자리)
            if (cleanNumber.length < 13 || cleanNumber.length > 19) {
                return false;
            }
            
            // Luhn 알고리즘을 사용한 체크섬 검증
            let sum = 0;
            let double = false;
            
            // 오른쪽에서 왼쪽으로 계산
            for (let i = cleanNumber.length - 1; i >= 0; i--) {
                let digit = parseInt(cleanNumber.charAt(i));
                
                if (double) {
                    digit *= 2;
                    if (digit > 9) {
                        digit -= 9;
                    }
                }
                
                sum += digit;
                double = !double;
            }
            
            return sum % 10 === 0;
        },
        
        /**
         * 한글 이름 유효성 검사
         * 
         * @param {string} name - 검사할 이름
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidKoreanName: function(name) {
            if (!name) return false;
            
            // 한글만 포함되어 있는지 확인 (2~20자)
            const namePattern = /^[가-힣]{2,20}$/;
            return namePattern.test(name);
        },
        
        /**
         * 영문 이름 유효성 검사
         * 
         * @param {string} name - 검사할 이름
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidEnglishName: function(name) {
            if (!name) return false;
            
            // 영문자와 공백만 포함되어 있는지 확인 (2~50자)
            const namePattern = /^[A-Za-z\s]{2,50}$/;
            return namePattern.test(name);
        },
        
        /**
         * 나이 유효성 검사
         * 
         * @param {number} age - 검사할 나이
         * @param {number} minAge - 최소 나이 (기본값: 0)
         * @param {number} maxAge - 최대 나이 (기본값: 150)
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidAge: function(age, minAge = 0, maxAge = 150) {
            if (age === undefined || age === null) return false;
            
            const numAge = parseInt(age, 10);
            
            if (isNaN(numAge)) {
                return false;
            }
            
            return numAge >= minAge && numAge <= maxAge;
        },
        
        /**
         * 숫자 유효성 검사
         * 
         * @param {*} value - 검사할 값
         * @param {number} min - 최소값 (옵션)
         * @param {number} max - 최대값 (옵션)
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidNumber: function(value, min = null, max = null) {
            if (value === undefined || value === null || value === '') return false;
            
            // 숫자로 변환
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                return false;
            }
            
            // 최소값 검사
            if (min !== null && numValue < min) {
                return false;
            }
            
            // 최대값 검사
            if (max !== null && numValue > max) {
                return false;
            }
            
            return true;
        },
        
        /**
         * 정수 유효성 검사
         * 
         * @param {*} value - 검사할 값
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidInteger: function(value) {
            if (value === undefined || value === null || value === '') return false;
            
            // 정수 여부 확인
            return Number.isInteger(parseFloat(value)) && /^-?\d+$/.test(value);
        },
        
        /**
         * 필수 입력값 검사
         * 
         * @param {*} value - 검사할 값
         * @returns {boolean} - 유효성 검사 결과
         */
        isNotEmpty: function(value) {
            if (value === undefined || value === null) return false;
            
            if (typeof value === 'string') {
                return value.trim() !== '';
            }
            
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            
            if (typeof value === 'object') {
                return Object.keys(value).length > 0;
            }
            
            return true;
        },
        
        /**
         * 문자열 길이 검사
         * 
         * @param {string} value - 검사할 문자열
         * @param {number} minLength - 최소 길이
         * @param {number} maxLength - 최대 길이
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidLength: function(value, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
            if (value === undefined || value === null) return false;
            
            const strValue = String(value);
            return strValue.length >= minLength && strValue.length <= maxLength;
        },
        
        /**
         * 파일 확장자 검사
         * 
         * @param {string} fileName - 검사할 파일명
         * @param {Array<string>} allowedExtensions - 허용된 확장자 배열 
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidFileExtension: function(fileName, allowedExtensions) {
            if (!fileName || !allowedExtensions || !Array.isArray(allowedExtensions)) {
                return false;
            }
            
            const ext = fileName.split('.').pop().toLowerCase();
            return allowedExtensions.includes(ext);
        },
        
        /**
         * 파일 크기 검사
         * 
         * @param {number} fileSize - 파일 크기 (바이트)
         * @param {number} maxSize - 최대 허용 크기 (바이트)
         * @returns {boolean} - 유효성 검사 결과
         */
        isValidFileSize: function(fileSize, maxSize) {
            if (fileSize === undefined || fileSize === null || maxSize === undefined || maxSize === null) {
                return false;
            }
            
            return fileSize <= maxSize;
        }
    };
})();