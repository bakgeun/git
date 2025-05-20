/**
 * DOM 조작 유틸리티
 * 브라우저 DOM 요소를 쉽게 다루기 위한 유틸리티 함수들을 제공합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // domUtils 네임스페이스 생성
    window.domUtils = {
        /**
         * 요소 선택 (querySelector의 간소화 버전)
         * 
         * @param {string} selector - CSS 선택자
         * @param {Element} [parent=document] - 부모 요소 (기본값: document)
         * @returns {Element|null} - 선택된 요소 또는 null
         */
        select: function(selector, parent = document) {
            return parent.querySelector(selector);
        },
        
        /**
         * 여러 요소 선택 (querySelectorAll의 간소화 버전)
         * 
         * @param {string} selector - CSS 선택자
         * @param {Element} [parent=document] - 부모 요소 (기본값: document)
         * @returns {Array<Element>} - 선택된 요소 배열
         */
        selectAll: function(selector, parent = document) {
            return Array.from(parent.querySelectorAll(selector));
        },
        
        /**
         * ID로 요소 선택 (getElementById의 간소화 버전)
         * 
         * @param {string} id - 요소 ID
         * @returns {Element|null} - 선택된 요소 또는 null
         */
        getById: function(id) {
            return document.getElementById(id);
        },
        
        /**
         * 클래스명으로 요소들 선택 (getElementsByClassName의 간소화 버전)
         * 
         * @param {string} className - 클래스 이름
         * @param {Element} [parent=document] - 부모 요소 (기본값: document)
         * @returns {Array<Element>} - 선택된 요소 배열
         */
        getByClass: function(className, parent = document) {
            return Array.from(parent.getElementsByClassName(className));
        },
        
        /**
         * 태그명으로 요소들 선택 (getElementsByTagName의 간소화 버전)
         * 
         * @param {string} tagName - 태그 이름
         * @param {Element} [parent=document] - 부모 요소 (기본값: document)
         * @returns {Array<Element>} - 선택된 요소 배열
         */
        getByTag: function(tagName, parent = document) {
            return Array.from(parent.getElementsByTagName(tagName));
        },
        
        /**
         * 요소 생성 (createElement의 확장 버전)
         * 
         * @param {string} tag - 태그 이름
         * @param {object} [attributes={}] - 속성 객체
         * @param {string|Element|Array<Element>} [children] - 자식 요소 또는 텍스트
         * @returns {Element} - 생성된 요소
         */
        create: function(tag, attributes = {}, children) {
            const element = document.createElement(tag);
            
            // 속성 설정
            for (const key in attributes) {
                if (key === 'style' && typeof attributes[key] === 'object') {
                    // 스타일 객체 처리
                    Object.assign(element.style, attributes[key]);
                } else if (key === 'dataset' && typeof attributes[key] === 'object') {
                    // 데이터셋 객체 처리
                    for (const dataKey in attributes[key]) {
                        element.dataset[dataKey] = attributes[key][dataKey];
                    }
                } else if (key === 'class' || key === 'className') {
                    // 클래스 처리 (배열 또는 문자열)
                    if (Array.isArray(attributes[key])) {
                        element.className = attributes[key].join(' ');
                    } else {
                        element.className = attributes[key];
                    }
                } else if (key === 'text') {
                    // 텍스트 콘텐츠 설정
                    element.textContent = attributes[key];
                } else if (key === 'html') {
                    // HTML 콘텐츠 설정
                    element.innerHTML = attributes[key];
                } else if (key.startsWith('on') && typeof attributes[key] === 'function') {
                    // 이벤트 리스너 추가
                    const eventName = key.slice(2).toLowerCase();
                    element.addEventListener(eventName, attributes[key]);
                } else {
                    // 일반 속성 설정
                    element.setAttribute(key, attributes[key]);
                }
            }
            
            // 자식 요소 추가
            if (children !== undefined) {
                if (typeof children === 'string') {
                    // 문자열인 경우 텍스트 노드로 추가
                    element.textContent = children;
                } else if (children instanceof Element) {
                    // 단일 요소인 경우
                    element.appendChild(children);
                } else if (Array.isArray(children)) {
                    // 요소 배열인 경우
                    children.forEach(child => {
                        if (child instanceof Element) {
                            element.appendChild(child);
                        } else if (typeof child === 'string') {
                            // 문자열인 경우 텍스트 노드로 추가
                            const textNode = document.createTextNode(child);
                            element.appendChild(textNode);
                        }
                    });
                }
            }
            
            return element;
        },
        
        /**
         * 요소 삭제
         * 
         * @param {Element|string} element - 삭제할 요소 또는 선택자
         * @returns {boolean} - 삭제 성공 여부
         */
        remove: function(element) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
                return true;
            }
            
            return false;
        },
        
        /**
         * 요소의 모든 자식 삭제
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @returns {Element} - 비워진 요소
         */
        empty: function(element) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (el) {
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
            }
            
            return el;
        },
        
        /**
         * 요소 앞에 새 요소 삽입
         * 
         * @param {Element|string} element - 기준 요소 또는 선택자
         * @param {Element} newElement - 삽입할 요소
         * @returns {Element} - 삽입된 요소
         */
        before: function(element, newElement) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (el && el.parentNode) {
                el.parentNode.insertBefore(newElement, el);
                return newElement;
            }
            
            return null;
        },
        
        /**
         * 요소 뒤에 새 요소 삽입
         * 
         * @param {Element|string} element - 기준 요소 또는 선택자
         * @param {Element} newElement - 삽입할 요소
         * @returns {Element} - 삽입된 요소
         */
        after: function(element, newElement) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (el && el.parentNode) {
                if (el.nextSibling) {
                    el.parentNode.insertBefore(newElement, el.nextSibling);
                } else {
                    el.parentNode.appendChild(newElement);
                }
                return newElement;
            }
            
            return null;
        },
        
        /**
         * 요소 맨 앞에 자식 요소 추가
         * 
         * @param {Element|string} parent - 부모 요소 또는 선택자
         * @param {Element} newElement - 추가할 요소
         * @returns {Element} - 추가된 요소
         */
        prepend: function(parent, newElement) {
            const parentEl = typeof parent === 'string' ? this.select(parent) : parent;
            
            if (parentEl) {
                if (parentEl.firstChild) {
                    parentEl.insertBefore(newElement, parentEl.firstChild);
                } else {
                    parentEl.appendChild(newElement);
                }
                return newElement;
            }
            
            return null;
        },
        
        /**
         * 요소 맨 뒤에 자식 요소 추가
         * 
         * @param {Element|string} parent - 부모 요소 또는 선택자
         * @param {Element} newElement - 추가할 요소
         * @returns {Element} - 추가된 요소
         */
        append: function(parent, newElement) {
            const parentEl = typeof parent === 'string' ? this.select(parent) : parent;
            
            if (parentEl) {
                parentEl.appendChild(newElement);
                return newElement;
            }
            
            return null;
        },
        
        /**
         * 요소 복제
         * 
         * @param {Element|string} element - 복제할 요소 또는 선택자
         * @param {boolean} [deep=true] - 자식 요소도 복제할지 여부
         * @returns {Element} - 복제된 요소
         */
        clone: function(element, deep = true) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (el) {
                return el.cloneNode(deep);
            }
            
            return null;
        },
        
        /**
         * 부모 요소 찾기
         * 
         * @param {Element|string} element - 시작 요소 또는 선택자
         * @param {string} [selector] - 찾을 부모 요소의 선택자 (선택적)
         * @returns {Element|null} - 찾은 부모 요소 또는 null
         */
        parent: function(element, selector) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 선택자가 없는 경우 바로 위 부모 반환
            if (!selector) {
                return el.parentElement;
            }
            
            // 선택자와 일치하는 부모 찾기
            let parent = el.parentElement;
            
            while (parent) {
                if (parent.matches(selector)) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            
            return null;
        },
        
        /**
         * 조상 요소들 찾기
         * 
         * @param {Element|string} element - 시작 요소 또는 선택자
         * @param {string} [selector] - 찾을 조상 요소의 선택자 (선택적)
         * @returns {Array<Element>} - 찾은 조상 요소 배열
         */
        parents: function(element, selector) {
            const el = typeof element === 'string' ? this.select(element) : element;
            const parents = [];
            
            if (!el) {
                return parents;
            }
            
            let parent = el.parentElement;
            
            while (parent) {
                if (!selector || parent.matches(selector)) {
                    parents.push(parent);
                }
                parent = parent.parentElement;
            }
            
            return parents;
        },
        
        /**
         * 가장 가까운 조상 요소 찾기 (자신 포함)
         * 
         * @param {Element|string} element - 시작 요소 또는 선택자
         * @param {string} selector - 찾을 조상 요소의 선택자
         * @returns {Element|null} - 찾은 조상 요소 또는 null
         */
        closest: function(element, selector) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // Element.closest() 메서드 사용
            return el.closest(selector);
        },
        
        /**
         * 형제 요소들 찾기
         * 
         * @param {Element|string} element - 시작 요소 또는 선택자
         * @param {string} [selector] - 찾을 형제 요소의 선택자 (선택적)
         * @returns {Array<Element>} - 찾은 형제 요소 배열
         */
        siblings: function(element, selector) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el || !el.parentElement) {
                return [];
            }
            
            const siblings = Array.from(el.parentElement.children).filter(child => child !== el);
            
            if (selector) {
                return siblings.filter(sibling => sibling.matches(selector));
            }
            
            return siblings;
        },
        
        /**
         * 자식 요소들 찾기
         * 
         * @param {Element|string} element - 부모 요소 또는 선택자
         * @param {string} [selector] - 찾을 자식 요소의 선택자 (선택적)
         * @returns {Array<Element>} - 찾은 자식 요소 배열
         */
        children: function(element, selector) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return [];
            }
            
            const children = Array.from(el.children);
            
            if (selector) {
                return children.filter(child => child.matches(selector));
            }
            
            return children;
        },
        
        /**
         * 다음 형제 요소 찾기
         * 
         * @param {Element|string} element - 시작 요소 또는 선택자
         * @param {string} [selector] - 찾을 형제 요소의 선택자 (선택적)
         * @returns {Element|null} - 찾은 형제 요소 또는 null
         */
        next: function(element, selector) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            let nextSibling = el.nextElementSibling;
            
            if (!selector) {
                return nextSibling;
            }
            
            while (nextSibling) {
                if (nextSibling.matches(selector)) {
                    return nextSibling;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
            
            return null;
        },
        
        /**
         * 이전 형제 요소 찾기
         * 
         * @param {Element|string} element - 시작 요소 또는 선택자
         * @param {string} [selector] - 찾을 형제 요소의 선택자 (선택적)
         * @returns {Element|null} - 찾은 형제 요소 또는 null
         */
        prev: function(element, selector) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            let prevSibling = el.previousElementSibling;
            
            if (!selector) {
                return prevSibling;
            }
            
            while (prevSibling) {
                if (prevSibling.matches(selector)) {
                    return prevSibling;
                }
                prevSibling = prevSibling.previousElementSibling;
            }
            
            return null;
        },
        
        /**
         * 클래스 추가
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string|Array<string>} classes - 추가할 클래스 이름 또는 배열
         * @returns {Element} - 대상 요소
         */
        addClass: function(element, classes) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            if (Array.isArray(classes)) {
                el.classList.add(...classes);
            } else {
                // 공백으로 구분된 여러 클래스 처리
                const classArray = classes.split(' ').filter(c => c.trim() !== '');
                el.classList.add(...classArray);
            }
            
            return el;
        },
        
        /**
         * 클래스 제거
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string|Array<string>} classes - 제거할 클래스 이름 또는 배열
         * @returns {Element} - 대상 요소
         */
        removeClass: function(element, classes) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            if (Array.isArray(classes)) {
                el.classList.remove(...classes);
            } else {
                // 공백으로 구분된 여러 클래스 처리
                const classArray = classes.split(' ').filter(c => c.trim() !== '');
                el.classList.remove(...classArray);
            }
            
            return el;
        },
        
        /**
         * 클래스 토글
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} className - 토글할 클래스 이름
         * @param {boolean} [force] - 강제 추가/제거 여부 (선택적)
         * @returns {boolean} - 토글 후 클래스 존재 여부
         */
        toggleClass: function(element, className, force) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return false;
            }
            
            return el.classList.toggle(className, force);
        },
        
        /**
         * 클래스 존재 여부 확인
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} className - 확인할 클래스 이름
         * @returns {boolean} - 클래스 존재 여부
         */
        hasClass: function(element, className) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return false;
            }
            
            return el.classList.contains(className);
        },
        
        /**
         * 요소 스타일 설정/가져오기
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string|object} property - 스타일 속성 이름 또는 속성 객체
         * @param {string} [value] - 설정할 값 (선택적)
         * @returns {string|object|Element} - 속성값 또는 요소
         */
        css: function(element, property, value) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 속성 객체인 경우 여러 속성 설정
            if (typeof property === 'object') {
                Object.keys(property).forEach(key => {
                    el.style[key] = property[key];
                });
                return el;
            }
            
            // 값이 제공된 경우 속성 설정
            if (value !== undefined) {
                el.style[property] = value;
                return el;
            }
            
            // 값이 없는 경우 계산된 스타일 반환
            return getComputedStyle(el)[property];
        },
        
        /**
         * 요소 속성 설정/가져오기
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string|object} name - 속성 이름 또는 속성 객체
         * @param {string} [value] - 설정할 값 (선택적)
         * @returns {string|Element} - 속성값 또는 요소
         */
        attr: function(element, name, value) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 속성 객체인 경우 여러 속성 설정
            if (typeof name === 'object') {
                Object.keys(name).forEach(key => {
                    el.setAttribute(key, name[key]);
                });
                return el;
            }
            
            // 값이 제공된 경우 속성 설정
            if (value !== undefined) {
                el.setAttribute(name, value);
                return el;
            }
            
            // 값이 없는 경우 속성값 반환
            return el.getAttribute(name);
        },
        
        /**
         * 요소 속성 제거
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string|Array<string>} names - 제거할 속성 이름 또는 배열
         * @returns {Element} - 대상 요소
         */
        removeAttr: function(element, names) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 문자열 또는 배열 처리
            const nameArray = Array.isArray(names) ? names : [names];
            
            nameArray.forEach(name => {
                el.removeAttribute(name);
            });
            
            return el;
        },
        
        /**
         * 요소의 텍스트 콘텐츠 설정/가져오기
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} [text] - 설정할 텍스트 (선택적)
         * @returns {string|Element} - 텍스트 콘텐츠 또는 요소
         */
        text: function(element, text) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 값이 제공된 경우 텍스트 설정
            if (text !== undefined) {
                el.textContent = text;
                return el;
            }
            
            // 값이 없는 경우 텍스트 반환
            return el.textContent;
        },
        
        /**
         * 요소의 HTML 콘텐츠 설정/가져오기
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} [html] - 설정할 HTML (선택적)
         * @returns {string|Element} - HTML 콘텐츠 또는 요소
         */
        html: function(element, html) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 값이 제공된 경우 HTML 설정
            if (html !== undefined) {
                el.innerHTML = html;
                return el;
            }
            
            // 값이 없는 경우 HTML 반환
            return el.innerHTML;
        },
        
        /**
         * 요소의 값 설정/가져오기 (폼 요소용)
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} [value] - 설정할 값 (선택적)
         * @returns {string|Element} - 요소의 값 또는 요소
         */
        val: function(element, value) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 값이 제공된 경우 값 설정
            if (value !== undefined) {
                el.value = value;
                return el;
            }
            
            // 값이 없는 경우 값 반환
            return el.value;
        },
        
        /**
         * 요소에 이벤트 리스너 추가
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} eventType - 이벤트 유형
         * @param {Function} listener - 이벤트 리스너
         * @param {object|boolean} [options] - 이벤트 옵션 (선택적)
         * @returns {Element} - 대상 요소
         */
        on: function(element, eventType, listener, options) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 이벤트 리스너 추가
            el.addEventListener(eventType, listener, options);
            return el;
        },
        
        /**
         * 요소에서 이벤트 리스너 제거
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} eventType - 이벤트 유형
         * @param {Function} listener - 이벤트 리스너
         * @param {object|boolean} [options] - 이벤트 옵션 (선택적)
         * @returns {Element} - 대상 요소
         */
        off: function(element, eventType, listener, options) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 이벤트 리스너 제거
            el.removeEventListener(eventType, listener, options);
            return el;
        },
        
        /**
         * 요소에 일회성 이벤트 리스너 추가
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} eventType - 이벤트 유형
         * @param {Function} listener - 이벤트 리스너
         * @param {object|boolean} [options] - 이벤트 옵션 (선택적)
         * @returns {Element} - 대상 요소
         */
        once: function(element, eventType, listener, options) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // options 객체 생성 또는 수정
            const opts = typeof options === 'object' ? { ...options, once: true } : { once: true };
            
            // 이벤트 리스너 추가
            el.addEventListener(eventType, listener, opts);
            return el;
        },
        
        /**
         * 요소에 이벤트 발생시키기
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} eventType - 이벤트 유형
         * @param {object} [options] - 이벤트 상세 정보 (선택적)
         * @returns {boolean} - 이벤트 전파 여부
         */
        trigger: function(element, eventType, options = {}) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return false;
            }
            
            // 이벤트 생성
            const event = new CustomEvent(eventType, {
                bubbles: true,
                cancelable: true,
                detail: options.detail || null,
                ...options
            });
            
            // 이벤트 발생
            return el.dispatchEvent(event);
        },
        
        /**
         * 요소의 위치 및 크기 정보 가져오기
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @returns {DOMRect|null} - 요소의 위치 및 크기 정보
         */
        rect: function(element) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            return el.getBoundingClientRect();
        },
        
        /**
         * 요소가 화면에 보이는지 확인
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {boolean} [partially=false] - 부분적으로 보이는지 여부 (기본값: false)
         * @returns {boolean} - 보이는지 여부
         */
        isVisible: function(element, partially = false) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return false;
            }
            
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const windowWidth = window.innerWidth || document.documentElement.clientWidth;
            
            // 요소가 화면 밖에 있는 경우
            if (rect.right <= 0 || rect.left >= windowWidth || rect.bottom <= 0 || rect.top >= windowHeight) {
                return false;
            }
            
            // 부분적으로 보이는지 여부
            if (partially) {
                return true;
            }
            
            // 완전히 보이는지 여부
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= windowHeight &&
                rect.right <= windowWidth
            );
        },
        
        /**
         * 요소로 스크롤
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {object} [options] - 스크롤 옵션 (선택적)
         * @returns {Element} - 대상 요소
         */
        scrollTo: function(element, options = {}) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            // 기본 옵션
            const defaultOptions = {
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            };
            
            // 옵션 병합
            const scrollOptions = { ...defaultOptions, ...options };
            
            // 요소로 스크롤
            el.scrollIntoView(scrollOptions);
            return el;
        },
        
        /**
         * 폼 데이터를 객체로 변환
         * 
         * @param {Element|string} form - 폼 요소 또는 선택자
         * @returns {object} - 폼 데이터 객체
         */
        formToObject: function(form) {
            const formEl = typeof form === 'string' ? this.select(form) : form;
            
            if (!formEl || formEl.nodeName !== 'FORM') {
                return {};
            }
            
            const formData = new FormData(formEl);
            const result = {};
            
            for (const [key, value] of formData.entries()) {
                // 같은 이름의 필드가 여러 개인 경우 배열로 처리
                if (result[key]) {
                    if (!Array.isArray(result[key])) {
                        result[key] = [result[key]];
                    }
                    result[key].push(value);
                } else {
                    result[key] = value;
                }
            }
            
            return result;
        },
        
        /**
         * 요소 외부 클릭 감지
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {Function} callback - 외부 클릭 시 호출할 콜백 함수
         * @returns {Function} - 이벤트 리스너 제거 함수
         */
        onClickOutside: function(element, callback) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el || typeof callback !== 'function') {
                return () => {};
            }
            
            // 이벤트 리스너 생성
            const listener = function(event) {
                if (!el.contains(event.target)) {
                    callback(event);
                }
            };
            
            // 문서에 이벤트 리스너 추가
            document.addEventListener('click', listener);
            
            // 이벤트 리스너 제거 함수 반환
            return function() {
                document.removeEventListener('click', listener);
            };
        },
        
        /**
         * 요소 표시/숨김 토글
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {boolean} [force] - 강제 표시/숨김 여부 (선택적)
         * @returns {boolean} - 토글 후 표시 여부
         */
        toggle: function(element, force) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return false;
            }
            
            const isHidden = window.getComputedStyle(el).display === 'none';
            
            // force 파라미터가 지정된 경우
            if (force !== undefined) {
                el.style.display = force ? '' : 'none';
                return force;
            }
            
            // 토글
            el.style.display = isHidden ? '' : 'none';
            return !isHidden;
        },
        
        /**
         * 요소 표시
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @param {string} [displayValue='block'] - display 속성값 (기본값: 'block')
         * @returns {Element} - 대상 요소
         */
        show: function(element, displayValue = 'block') {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            el.style.display = displayValue;
            return el;
        },
        
        /**
         * 요소 숨김
         * 
         * @param {Element|string} element - 대상 요소 또는 선택자
         * @returns {Element} - 대상 요소
         */
        hide: function(element) {
            const el = typeof element === 'string' ? this.select(element) : element;
            
            if (!el) {
                return null;
            }
            
            el.style.display = 'none';
            return el;
        }
    };
})();