/**
 * 폼 컴포넌트
 * 폼 유효성 검사, 폼 데이터 처리 등 폼 관련 공통 기능 제공
 */

(function() {
    'use strict';

    window.Forms = {
        /**
         * 폼 유효성 검사 규칙
         * @private
         */
        _validationRules: {
            required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            phone: (value) => /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/.test(value),
            minLength: (value, length) => value.length >= length,
            maxLength: (value, length) => value.length <= length,
            pattern: (value, pattern) => new RegExp(pattern).test(value),
            numeric: (value) => /^[0-9]+$/.test(value),
            alphanumeric: (value) => /^[a-zA-Z0-9]+$/.test(value),
            url: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            date: (value) => !isNaN(Date.parse(value)),
            minValue: (value, min) => parseFloat(value) >= min,
            maxValue: (value, max) => parseFloat(value) <= max,
            confirmed: (value, confirmFieldName, form) => {
                const confirmField = form.querySelector(`[name="${confirmFieldName}"]`);
                return confirmField && value === confirmField.value;
            }
        },

        /**
         * 기본 오류 메시지
         * @private
         */
        _defaultMessages: {
            required: '필수 입력 항목입니다.',
            email: '올바른 이메일 주소를 입력해주세요.',
            phone: '올바른 전화번호 형식(예: 010-1234-5678)으로 입력해주세요.',
            minLength: '최소 {0}자 이상 입력해주세요.',
            maxLength: '최대 {0}자까지 입력 가능합니다.',
            pattern: '올바른 형식으로 입력해주세요.',
            numeric: '숫자만 입력 가능합니다.',
            alphanumeric: '영문자와 숫자만 입력 가능합니다.',
            url: '올바른 URL을 입력해주세요.',
            date: '올바른 날짜를 입력해주세요.',
            minValue: '최소값은 {0}입니다.',
            maxValue: '최대값은 {0}입니다.',
            confirmed: '값이 일치하지 않습니다.'
        },

        /**
         * 폼 유효성 검사
         * @param {HTMLFormElement} form - 검사할 폼
         * @param {Object} rules - 유효성 검사 규칙
         * @param {Object} messages - 커스텀 오류 메시지
         * @returns {Object} - { isValid: boolean, errors: object }
         */
        validate: function(form, rules = {}, messages = {}) {
            const errors = {};
            let isValid = true;

            // 이전 오류 메시지 제거
            this.clearErrors(form);

            // 각 필드에 대한 유효성 검사
            Object.keys(rules).forEach(fieldName => {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (!field) return;

                const fieldRules = rules[fieldName];
                const value = this.getFieldValue(field);
                const fieldErrors = [];

                // 각 규칙 검사
                Object.keys(fieldRules).forEach(ruleName => {
                    if (ruleName === 'messages') return; // 메시지는 건너뛰기

                    const ruleValue = fieldRules[ruleName];
                    const validationFunction = this._validationRules[ruleName];

                    if (!validationFunction) {
                        console.warn(`Unknown validation rule: ${ruleName}`);
                        return;
                    }

                    // 규칙 검사 수행
                    let isRuleValid = false;
                    if (ruleName === 'confirmed') {
                        isRuleValid = validationFunction(value, ruleValue, form);
                    } else if (typeof ruleValue === 'boolean') {
                        isRuleValid = !ruleValue || validationFunction(value);
                    } else {
                        isRuleValid = validationFunction(value, ruleValue);
                    }

                    if (!isRuleValid) {
                        // 오류 메시지 결정
                        let errorMessage = fieldRules.messages?.[ruleName] || 
                                          messages[fieldName]?.[ruleName] || 
                                          this._defaultMessages[ruleName];

                        // 메시지에 파라미터 치환
                        if (errorMessage && errorMessage.includes('{0}')) {
                            errorMessage = errorMessage.replace('{0}', ruleValue);
                        }

                        fieldErrors.push(errorMessage);
                        isValid = false;
                    }
                });

                if (fieldErrors.length > 0) {
                    errors[fieldName] = fieldErrors;
                    this.showFieldError(field, fieldErrors[0]);
                }
            });

            return { isValid, errors };
        },

        /**
         * 필드값 가져오기
         * @param {HTMLElement} field - 폼 필드
         * @returns {*} - 필드값
         */
        getFieldValue: function(field) {
            if (field.type === 'checkbox') {
                return field.checked;
            } else if (field.type === 'radio') {
                const checkedRadio = document.querySelector(`[name="${field.name}"]:checked`);
                return checkedRadio ? checkedRadio.value : '';
            } else if (field.tagName === 'SELECT' && field.multiple) {
                return Array.from(field.selectedOptions).map(option => option.value);
            } else if (field.type === 'file') {
                return field.files;
            } else {
                return field.value;
            }
        },

        /**
         * 필드 오류 표시
         * @param {HTMLElement} field - 폼 필드
         * @param {string} message - 오류 메시지
         */
        showFieldError: function(field, message) {
            // 필드에 오류 클래스 추가
            field.classList.add('is-invalid');

            // 오류 메시지 요소 생성
            const errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            errorElement.textContent = message;

            // 오류 메시지 삽입
            const formGroup = field.closest('.form-group') || field.parentElement;
            formGroup.appendChild(errorElement);
        },

        /**
         * 필드 오류 제거
         * @param {HTMLElement} field - 폼 필드
         */
        clearFieldError: function(field) {
            field.classList.remove('is-invalid');
            
            const formGroup = field.closest('.form-group') || field.parentElement;
            const errorElement = formGroup.querySelector('.invalid-feedback');
            if (errorElement) {
                errorElement.remove();
            }
        },

        /**
         * 폼의 모든 오류 제거
         * @param {HTMLFormElement} form - 폼
         */
        clearErrors: function(form) {
            form.querySelectorAll('.is-invalid').forEach(field => {
                this.clearFieldError(field);
            });
        },

        /**
         * 폼 데이터를 객체로 변환
         * @param {HTMLFormElement} form - 폼
         * @returns {Object} - 폼 데이터 객체
         */
        serializeToObject: function(form) {
            const formData = new FormData(form);
            const data = {};

            formData.forEach((value, key) => {
                // 체크박스 처리
                const field = form.querySelector(`[name="${key}"]`);
                if (field && field.type === 'checkbox') {
                    if (!data[key]) data[key] = [];
                    if (field.checked) data[key].push(value);
                } 
                // 다중 선택 처리
                else if (data[key]) {
                    if (!Array.isArray(data[key])) data[key] = [data[key]];
                    data[key].push(value);
                } 
                // 일반 필드
                else {
                    data[key] = value;
                }
            });

            // 체크박스 배열이 비어있으면 false로 처리
            Object.keys(data).forEach(key => {
                if (Array.isArray(data[key]) && data[key].length === 0) {
                    data[key] = false;
                }
            });

            return data;
        },

        /**
         * 객체 데이터를 폼에 채우기
         * @param {HTMLFormElement} form - 폼
         * @param {Object} data - 데이터 객체
         */
        fillForm: function(form, data) {
            Object.keys(data).forEach(key => {
                const value = data[key];
                const field = form.querySelector(`[name="${key}"]`);

                if (!field) return;

                if (field.type === 'checkbox' || field.type === 'radio') {
                    if (Array.isArray(value)) {
                        // 다중 체크박스
                        form.querySelectorAll(`[name="${key}"]`).forEach(checkbox => {
                            checkbox.checked = value.includes(checkbox.value);
                        });
                    } else {
                        // 단일 체크박스 또는 라디오
                        field.checked = field.value === value || value === true;
                    }
                } else if (field.tagName === 'SELECT' && field.multiple) {
                    // 다중 선택
                    Array.from(field.options).forEach(option => {
                        option.selected = Array.isArray(value) ? 
                            value.includes(option.value) : 
                            option.value === value;
                    });
                } else if (field.type === 'file') {
                    // 파일 필드는 보안상 값을 설정할 수 없음
                    console.warn(`Cannot set value for file input: ${key}`);
                } else {
                    // 일반 필드
                    field.value = value;
                }
            });
        },

        /**
         * 폼 리셋
         * @param {HTMLFormElement} form - 폼
         */
        reset: function(form) {
            form.reset();
            this.clearErrors(form);
        },

        /**
         * AJAX 폼 제출
         * @param {HTMLFormElement} form - 폼
         * @param {Object} options - 옵션
         * @returns {Promise} - 제출 결과
         */
        submitAjax: async function(form, options = {}) {
            const defaults = {
                url: form.action,
                method: form.method || 'POST',
                headers: {},
                beforeSubmit: null,
                onSuccess: null,
                onError: null,
                validation: null
            };

            const config = Object.assign({}, defaults, options);

            // 유효성 검사
            if (config.validation) {
                const validationResult = this.validate(form, config.validation.rules, config.validation.messages);
                if (!validationResult.isValid) {
                    if (config.onError) {
                        config.onError({ errors: validationResult.errors });
                    }
                    return Promise.reject(validationResult.errors);
                }
            }

            // beforeSubmit 콜백
            if (config.beforeSubmit) {
                const shouldContinue = await config.beforeSubmit(form);
                if (shouldContinue === false) {
                    return Promise.resolve(null);
                }
            }

            // 폼 데이터 준비
            let body;
            if (form.enctype === 'multipart/form-data') {
                body = new FormData(form);
            } else {
                body = new URLSearchParams(new FormData(form));
            }

            try {
                const response = await fetch(config.url, {
                    method: config.method,
                    headers: config.headers,
                    body: body
                });

                const data = await response.json();

                if (response.ok) {
                    if (config.onSuccess) {
                        config.onSuccess(data);
                    }
                    return data;
                } else {
                    if (config.onError) {
                        config.onError(data);
                    }
                    return Promise.reject(data);
                }
            } catch (error) {
                if (config.onError) {
                    config.onError(error);
                }
                return Promise.reject(error);
            }
        },

        /**
         * 폼 필드 자동 포맷팅
         * @param {HTMLElement} field - 필드
         * @param {string} format - 포맷 유형
         */
        formatField: function(field, format) {
            field.addEventListener('input', (e) => {
                let value = e.target.value;

                switch (format) {
                    case 'phone':
                        // 전화번호 포맷팅 (010-1234-5678)
                        value = value.replace(/[^0-9]/g, '');
                        if (value.length >= 4 && value.length <= 7) {
                            value = value.substr(0, 3) + '-' + value.substr(3);
                        } else if (value.length >= 8) {
                            value = value.substr(0, 3) + '-' + value.substr(3, 4) + '-' + value.substr(7, 4);
                        }
                        break;

                    case 'currency':
                        // 금액 포맷팅 (1,000,000)
                        value = value.replace(/[^0-9]/g, '');
                        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        break;

                    case 'date':
                        // 날짜 포맷팅 (2024-01-01)
                        value = value.replace(/[^0-9]/g, '');
                        if (value.length >= 5 && value.length <= 6) {
                            value = value.substr(0, 4) + '-' + value.substr(4);
                        } else if (value.length >= 7) {
                            value = value.substr(0, 4) + '-' + value.substr(4, 2) + '-' + value.substr(6, 2);
                        }
                        break;

                    case 'card':
                        // 카드번호 포맷팅 (1234-5678-9012-3456)
                        value = value.replace(/[^0-9]/g, '');
                        value = value.match(/.{1,4}/g)?.join('-') || value;
                        break;
                }

                e.target.value = value;
            });
        },

        /**
         * 폼 필드 동적 표시/숨김
         * @param {HTMLElement} triggerField - 트리거 필드
         * @param {string} targetSelector - 대상 요소 선택자
         * @param {function} condition - 표시 조건 함수
         */
        toggleField: function(triggerField, targetSelector, condition) {
            const targetElement = document.querySelector(targetSelector);
            if (!targetElement) return;

            const updateVisibility = () => {
                const value = this.getFieldValue(triggerField);
                const shouldShow = condition(value);
                targetElement.style.display = shouldShow ? '' : 'none';
            };

            // 초기 상태 설정
            updateVisibility();

            // 이벤트 리스너 설정
            triggerField.addEventListener('change', updateVisibility);
            if (triggerField.type === 'text' || triggerField.type === 'textarea') {
                triggerField.addEventListener('input', updateVisibility);
            }
        },

        /**
         * 폼 초기화 헬퍼
         * @param {HTMLFormElement} form - 폼
         * @param {Object} options - 옵션
         */
        init: function(form, options = {}) {
            // 자동 포맷팅 설정
            if (options.formatting) {
                Object.keys(options.formatting).forEach(selector => {
                    const fields = form.querySelectorAll(selector);
                    fields.forEach(field => {
                        this.formatField(field, options.formatting[selector]);
                    });
                });
            }

            // 동적 필드 설정
            if (options.toggles) {
                options.toggles.forEach(toggle => {
                    const triggerField = form.querySelector(toggle.trigger);
                    if (triggerField) {
                        this.toggleField(triggerField, toggle.target, toggle.condition);
                    }
                });
            }

            // 실시간 유효성 검사
            if (options.realTimeValidation) {
                const rules = options.realTimeValidation.rules;
                const messages = options.realTimeValidation.messages;

                Object.keys(rules).forEach(fieldName => {
                    const field = form.querySelector(`[name="${fieldName}"]`);
                    if (!field) return;

                    field.addEventListener('blur', () => {
                        const result = this.validate(form, { [fieldName]: rules[fieldName] }, messages);
                        if (!result.isValid) {
                            this.showFieldError(field, result.errors[fieldName][0]);
                        } else {
                            this.clearFieldError(field);
                        }
                    });
                });
            }

            // AJAX 제출 설정
            if (options.ajax) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.submitAjax(form, options.ajax);
                });
            }
        }
    };

    // jQuery 플러그인 스타일 인터페이스 (선택사항)
    if (typeof jQuery !== 'undefined') {
        jQuery.fn.dhcForm = function(options) {
            return this.each(function() {
                Forms.init(this, options);
            });
        };
    }
})();