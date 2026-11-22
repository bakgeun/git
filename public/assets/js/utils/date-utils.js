/**
 * 날짜 관련 유틸리티
 * 날짜 계산, 비교, 처리 등의 기능을 제공합니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // dateUtils 네임스페이스 생성
    window.dateUtils = {
        /**
         * 날짜 객체 생성
         * 
         * @param {Date|string|number|object} input - 날짜 입력값
         * @returns {Date} - 날짜 객체
         */
        parseDate: function(input) {
            if (!input) return new Date();
            
            // 이미 Date 객체인 경우
            if (input instanceof Date) {
                return input;
            }
            
            // Firebase 타임스탬프 처리
            if (typeof input === 'object') {
                if (input.toDate) {
                    return input.toDate();
                }
                
                if (input.seconds) {
                    return new Date(input.seconds * 1000);
                }
                
                // YYYY-MM-DD 형식의 객체 처리
                if (input.year && input.month) {
                    const month = input.month - 1; // JavaScript의 월은 0부터 시작
                    const day = input.day || 1;
                    return new Date(input.year, month, day);
                }
            }
            
            // 문자열 처리
            if (typeof input === 'string') {
                // 날짜 형식 자동 감지
                if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
                    // YYYY-MM-DD
                    const parts = input.split('-');
                    return new Date(parts[0], parts[1] - 1, parts[2]);
                } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
                    // MM/DD/YYYY
                    const parts = input.split('/');
                    return new Date(parts[2], parts[0] - 1, parts[1]);
                } else if (/^\d{4}\.\d{2}\.\d{2}$/.test(input)) {
                    // YYYY.MM.DD
                    const parts = input.split('.');
                    return new Date(parts[0], parts[1] - 1, parts[2]);
                }
            }
            
            // 기타 형식 (타임스탬프, ISO 문자열 등)
            return new Date(input);
        },
        
        /**
         * 오늘 날짜 가져오기
         * 
         * @param {boolean} startOfDay - 하루의 시작 시간으로 설정 여부 (00:00:00)
         * @returns {Date} - 오늘 날짜 객체
         */
        today: function(startOfDay = false) {
            const now = new Date();
            
            if (startOfDay) {
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            
            return now;
        },
        
        /**
         * 내일 날짜 가져오기
         * 
         * @param {boolean} startOfDay - 하루의 시작 시간으로 설정 여부 (00:00:00)
         * @returns {Date} - 내일 날짜 객체
         */
        tomorrow: function(startOfDay = false) {
            const today = this.today(startOfDay);
            return this.addDays(today, 1);
        },
        
        /**
         * 어제 날짜 가져오기
         * 
         * @param {boolean} startOfDay - 하루의 시작 시간으로 설정 여부 (00:00:00)
         * @returns {Date} - 어제 날짜 객체
         */
        yesterday: function(startOfDay = false) {
            const today = this.today(startOfDay);
            return this.addDays(today, -1);
        },
        
        /**
         * 날짜에 일 더하기/빼기
         * 
         * @param {Date|string|number} date - 기준 날짜
         * @param {number} days - 더하거나 뺄 일 수
         * @returns {Date} - 계산된 날짜 객체
         */
        addDays: function(date, days) {
            const d = this.parseDate(date);
            d.setDate(d.getDate() + days);
            return d;
        },
        
        /**
         * 날짜에 월 더하기/빼기
         * 
         * @param {Date|string|number} date - 기준 날짜
         * @param {number} months - 더하거나 뺄 월 수
         * @returns {Date} - 계산된 날짜 객체
         */
        addMonths: function(date, months) {
            const d = this.parseDate(date);
            d.setMonth(d.getMonth() + months);
            return d;
        },
        
        /**
         * 날짜에 년 더하기/빼기
         * 
         * @param {Date|string|number} date - 기준 날짜
         * @param {number} years - 더하거나 뺄 년 수
         * @returns {Date} - 계산된 날짜 객체
         */
        addYears: function(date, years) {
            const d = this.parseDate(date);
            d.setFullYear(d.getFullYear() + years);
            return d;
        },
        
        /**
         * 날짜에 시간 더하기/빼기
         * 
         * @param {Date|string|number} date - 기준 날짜
         * @param {number} hours - 더하거나 뺄 시간
         * @returns {Date} - 계산된 날짜 객체
         */
        addHours: function(date, hours) {
            const d = this.parseDate(date);
            d.setHours(d.getHours() + hours);
            return d;
        },
        
        /**
         * 날짜에 분 더하기/빼기
         * 
         * @param {Date|string|number} date - 기준 날짜
         * @param {number} minutes - 더하거나 뺄 분
         * @returns {Date} - 계산된 날짜 객체
         */
        addMinutes: function(date, minutes) {
            const d = this.parseDate(date);
            d.setMinutes(d.getMinutes() + minutes);
            return d;
        },
        
        /**
         * 날짜 형식 변환 (문자열)
         * 
         * @param {Date|string|number} date - 변환할 날짜
         * @param {string} format - 날짜 형식 (기본값: 'YYYY-MM-DD')
         * @returns {string} - 형식화된 날짜 문자열
         */
        format: function(date, format = 'YYYY-MM-DD') {
            return window.formatters.formatDate(date, format);
        },
        
        /**
         * 날짜 비교 (같은 날인지)
         * 
         * @param {Date|string|number} date1 - 첫 번째 날짜
         * @param {Date|string|number} date2 - 두 번째 날짜
         * @returns {boolean} - 같은 날인지 여부
         */
        isSameDay: function(date1, date2) {
            const d1 = this.parseDate(date1);
            const d2 = this.parseDate(date2);
            
            return (
                d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate()
            );
        },
        
        /**
         * 날짜 비교 (같은 월인지)
         * 
         * @param {Date|string|number} date1 - 첫 번째 날짜
         * @param {Date|string|number} date2 - 두 번째 날짜
         * @returns {boolean} - 같은 월인지 여부
         */
        isSameMonth: function(date1, date2) {
            const d1 = this.parseDate(date1);
            const d2 = this.parseDate(date2);
            
            return (
                d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth()
            );
        },
        
        /**
         * 날짜 비교 (같은 년인지)
         * 
         * @param {Date|string|number} date1 - 첫 번째 날짜
         * @param {Date|string|number} date2 - 두 번째 날짜
         * @returns {boolean} - 같은 년인지 여부
         */
        isSameYear: function(date1, date2) {
            const d1 = this.parseDate(date1);
            const d2 = this.parseDate(date2);
            
            return d1.getFullYear() === d2.getFullYear();
        },
        
        /**
         * 날짜 비교 (이전 날짜인지)
         * 
         * @param {Date|string|number} date1 - 비교할 날짜
         * @param {Date|string|number} date2 - 기준 날짜 (기본값: 오늘)
         * @returns {boolean} - 이전 날짜인지 여부
         */
        isBefore: function(date1, date2 = new Date()) {
            const d1 = this.parseDate(date1);
            const d2 = this.parseDate(date2);
            
            return d1 < d2;
        },
        
        /**
         * 날짜 비교 (이후 날짜인지)
         * 
         * @param {Date|string|number} date1 - 비교할 날짜
         * @param {Date|string|number} date2 - 기준 날짜 (기본값: 오늘)
         * @returns {boolean} - 이후 날짜인지 여부
         */
        isAfter: function(date1, date2 = new Date()) {
            const d1 = this.parseDate(date1);
            const d2 = this.parseDate(date2);
            
            return d1 > d2;
        },
        
        /**
         * 날짜 범위 내에 있는지 확인
         * 
         * @param {Date|string|number} date - 확인할 날짜
         * @param {Date|string|number} startDate - 시작 날짜
         * @param {Date|string|number} endDate - 종료 날짜
         * @returns {boolean} - 범위 내에 있는지 여부
         */
        isBetween: function(date, startDate, endDate) {
            const d = this.parseDate(date);
            const start = this.parseDate(startDate);
            const end = this.parseDate(endDate);
            
            return d >= start && d <= end;
        },
        
        /**
         * 날짜가 오늘인지 확인
         * 
         * @param {Date|string|number} date - 확인할 날짜
         * @returns {boolean} - 오늘인지 여부
         */
        isToday: function(date) {
            return this.isSameDay(date, new Date());
        },
        
        /**
         * 날짜 차이 계산 (일 수)
         * 
         * @param {Date|string|number} date1 - 첫 번째 날짜
         * @param {Date|string|number} date2 - 두 번째 날짜
         * @returns {number} - 두 날짜 사이의 일 수
         */
        dayDiff: function(date1, date2) {
            const d1 = this.parseDate(date1);
            const d2 = this.parseDate(date2);
            
            // 시간 차이를 밀리초로 계산하고 일 수로 변환
            const diffMs = Math.abs(d2 - d1);
            return Math.floor(diffMs / (1000 * 60 * 60 * 24));
        },
        
        /**
         * 날짜 차이 계산 (월 수)
         * 
         * @param {Date|string|number} date1 - 첫 번째 날짜
         * @param {Date|string|number} date2 - 두 번째 날짜
         * @returns {number} - 두 날짜 사이의 월 수
         */
        monthDiff: function(date1, date2) {
            const d1 = this.parseDate(date1);
            const d2 = this.parseDate(date2);
            
            const months = (d2.getFullYear() - d1.getFullYear()) * 12;
            return Math.abs(months + d2.getMonth() - d1.getMonth());
        },
        
        /**
         * 날짜 차이 계산 (년 수)
         * 
         * @param {Date|string|number} date1 - 첫 번째 날짜
         * @param {Date|string|number} date2 - 두 번째 날짜
         * @returns {number} - 두 날짜 사이의 년 수
         */
        yearDiff: function(date1, date2) {
            const d1 = this.parseDate(date1);
            const d2 = this.parseDate(date2);
            
            return Math.abs(d2.getFullYear() - d1.getFullYear());
        },
        
        /**
         * 하루의 시작 시간 설정 (00:00:00)
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 하루 시작 시간이 설정된 날짜 객체
         */
        startOfDay: function(date) {
            const d = this.parseDate(date);
            d.setHours(0, 0, 0, 0);
            return d;
        },
        
        /**
         * 하루의 끝 시간 설정 (23:59:59)
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 하루 끝 시간이 설정된 날짜 객체
         */
        endOfDay: function(date) {
            const d = this.parseDate(date);
            d.setHours(23, 59, 59, 999);
            return d;
        },
        
        /**
         * 월의 시작 날짜 설정 (1일)
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 월 시작일이 설정된 날짜 객체
         */
        startOfMonth: function(date) {
            const d = this.parseDate(date);
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            return d;
        },
        
        /**
         * 월의 마지막 날짜 설정
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 월 마지막일이 설정된 날짜 객체
         */
        endOfMonth: function(date) {
            const d = this.parseDate(date);
            d.setMonth(d.getMonth() + 1);
            d.setDate(0);
            d.setHours(23, 59, 59, 999);
            return d;
        },
        
        /**
         * 년의 시작 날짜 설정 (1월 1일)
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 년 시작일이 설정된 날짜 객체
         */
        startOfYear: function(date) {
            const d = this.parseDate(date);
            d.setMonth(0);
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            return d;
        },
        
        /**
         * 년의 마지막 날짜 설정 (12월 31일)
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 년 마지막일이 설정된 날짜 객체
         */
        endOfYear: function(date) {
            const d = this.parseDate(date);
            d.setMonth(11);
            d.setDate(31);
            d.setHours(23, 59, 59, 999);
            return d;
        },
        
        /**
         * 주의 시작 날짜 설정 (월요일)
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 주 시작일이 설정된 날짜 객체
         */
        startOfWeek: function(date) {
            const d = this.parseDate(date);
            const day = d.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
            
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            return d;
        },
        
        /**
         * 주의 마지막 날짜 설정 (일요일)
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 주 마지막일이 설정된 날짜 객체
         */
        endOfWeek: function(date) {
            const d = this.parseDate(date);
            const day = d.getDay();
            const diff = d.getDate() + (day === 0 ? 0 : 7 - day); // 일요일로 조정
            
            d.setDate(diff);
            d.setHours(23, 59, 59, 999);
            return d;
        },
        
        /**
         * 분기의 시작 날짜 설정
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 분기 시작일이 설정된 날짜 객체
         */
        startOfQuarter: function(date) {
            const d = this.parseDate(date);
            const quarter = Math.floor(d.getMonth() / 3);
            
            d.setMonth(quarter * 3);
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            return d;
        },
        
        /**
         * 분기의 마지막 날짜 설정
         * 
         * @param {Date|string|number} date - 설정할 날짜
         * @returns {Date} - 분기 마지막일이 설정된 날짜 객체
         */
        endOfQuarter: function(date) {
            const d = this.parseDate(date);
            const quarter = Math.floor(d.getMonth() / 3);
            
            d.setMonth(quarter * 3 + 3);
            d.setDate(0);
            d.setHours(23, 59, 59, 999);
            return d;
        },
        
        /**
         * 날짜가 윤년인지 확인
         * 
         * @param {Date|string|number|number} year - 확인할 연도 또는 날짜
         * @returns {boolean} - 윤년 여부
         */
        isLeapYear: function(year) {
            let y = year;
            
            // Date 객체인 경우 연도만 추출
            if (year instanceof Date) {
                y = year.getFullYear();
            } else if (typeof year === 'string' || typeof year === 'object') {
                // 문자열이나 객체인 경우 Date로 변환 후 연도 추출
                y = this.parseDate(year).getFullYear();
            }
            
            return ((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0);
        },
        
        /**
         * 특정 월의 일 수 가져오기
         * 
         * @param {number} year - 연도
         * @param {number} month - 월 (0-11)
         * @returns {number} - 해당 월의 일 수
         */
        getDaysInMonth: function(year, month) {
            // 월이 Date 객체인 경우 연도와 월 추출
            if (year instanceof Date) {
                month = year.getMonth();
                year = year.getFullYear();
            }
            
            // 0: 1월, 1: 2월, ..., 11: 12월
            return new Date(year, month + 1, 0).getDate();
        },
        
        /**
         * 달력 생성 (월별)
         * 
         * @param {number} year - 연도
         * @param {number} month - 월 (0-11)
         * @param {boolean} startFromMonday - 월요일부터 시작 여부 (기본값: true)
         * @returns {Array} - 날짜 배열 (6주 x 7일)
         */
        createCalendar: function(year, month, startFromMonday = true) {
            // 월이 Date 객체인 경우 연도와 월 추출
            if (year instanceof Date) {
                month = year.getMonth();
                year = year.getFullYear();
            }
            
            // 해당 월의 첫째 날
            const firstDay = new Date(year, month, 1);
            
            // 해당 월의 마지막 날
            const lastDay = new Date(year, month + 1, 0);
            
            // 이전 달의 마지막 날
            const prevMonthLastDay = new Date(year, month, 0);
            
            // 달력 배열 (6주 x 7일)
            const calendar = [];
            
            // 시작 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
            let startDayOfWeek = firstDay.getDay();
            
            // 월요일부터 시작인 경우 조정
            if (startFromMonday) {
                startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
            }
            
            // 현재 날짜
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 이전 달의 날짜 채우기
            let day = prevMonthLastDay.getDate() - startDayOfWeek + 1;
            
            for (let i = 0; i < startDayOfWeek; i++) {
                calendar.push({
                    date: new Date(year, month - 1, day),
                    day: day,
                    month: month - 1,
                    year: year,
                    isCurrentMonth: false,
                    isPrevMonth: true,
                    isNextMonth: false,
                    isToday: false
                });
                day++;
            }
            
            // 현재 달의 날짜 채우기
            for (let i = 1; i <= lastDay.getDate(); i++) {
                const date = new Date(year, month, i);
                
                calendar.push({
                    date: date,
                    day: i,
                    month: month,
                    year: year,
                    isCurrentMonth: true,
                    isPrevMonth: false,
                    isNextMonth: false,
                    isToday: date.getTime() === today.getTime()
                });
            }
            
            // 다음 달의 날짜 채우기 (42일 - 이전 날짜와 현재 날짜의 수)
            const remainingDays = 42 - calendar.length;
            
            for (let i = 1; i <= remainingDays; i++) {
                calendar.push({
                    date: new Date(year, month + 1, i),
                    day: i,
                    month: month + 1,
                    year: year,
                    isCurrentMonth: false,
                    isPrevMonth: false,
                    isNextMonth: true,
                    isToday: false
                });
            }
            
            return calendar;
        },
        
        /**
         * 날짜의 요일 이름 가져오기
         * 
         * @param {Date|string|number} date - 날짜
         * @param {string} locale - 로케일 (기본값: 'ko')
         * @param {string} format - 형식 ('long', 'short', 'narrow') (기본값: 'long')
         * @returns {string} - 요일 이름
         */
        getDayName: function(date, locale = 'ko', format = 'long') {
            const d = this.parseDate(date);
            
            // Intl.DateTimeFormat을 사용한 요일 이름 포맷팅
            return new Intl.DateTimeFormat(locale, { weekday: format }).format(d);
        },
        
        /**
         * 날짜의 월 이름 가져오기
         * 
         * @param {Date|string|number} date - 날짜
         * @param {string} locale - 로케일 (기본값: 'ko')
         * @param {string} format - 형식 ('long', 'short', 'narrow') (기본값: 'long')
         * @returns {string} - 월 이름
         */
        getMonthName: function(date, locale = 'ko', format = 'long') {
            const d = this.parseDate(date);
            
            // Intl.DateTimeFormat을 사용한 월 이름 포맷팅
            return new Intl.DateTimeFormat(locale, { month: format }).format(d);
        },
        
        /**
         * 날짜가 주말인지 확인
         * 
         * @param {Date|string|number} date - 확인할 날짜
         * @returns {boolean} - 주말 여부
         */
        isWeekend: function(date) {
            const d = this.parseDate(date);
            const day = d.getDay();
            
            // 0: 일요일, 6: 토요일
            return day === 0 || day === 6;
        },
        
        /**
         * 날짜가 공휴일인지 확인 (한국 공휴일)
         * 
         * @param {Date|string|number} date - 확인할 날짜
         * @returns {object} - 공휴일 정보 { isHoliday: boolean, name: string }
         */
        isHoliday: function(date) {
            const d = this.parseDate(date);
            const year = d.getFullYear();
            const month = d.getMonth(); // 0-11
            const day = d.getDate();
            
            // 한국 공휴일 (음력 제외)
            const holidays = [
                { month: 0, day: 1, name: '신정' }, // 1월 1일
                { month: 2, day: 1, name: '삼일절' }, // 3월 1일
                { month: 4, day: 5, name: '어린이날' }, // 5월 5일
                { month: 5, day: 6, name: '현충일' }, // 6월 6일
                { month: 7, day: 15, name: '광복절' }, // 8월 15일
                { month: 9, day: 3, name: '개천절' }, // 10월 3일
                { month: 9, day: 9, name: '한글날' }, // 10월 9일
                { month: 11, day: 25, name: '크리스마스' } // 12월 25일
            ];
            
            // 공휴일 여부 확인
            for (const holiday of holidays) {
                if (month === holiday.month && day === holiday.day) {
                    return { isHoliday: true, name: holiday.name };
                }
            }
            
            return { isHoliday: false, name: '' };
        },
        
        /**
         * 두 날짜 사이의 근무일 수 계산 (주말 제외)
         * 
         * @param {Date|string|number} startDate - 시작 날짜
         * @param {Date|string|number} endDate - 종료 날짜
         * @returns {number} - 근무일 수
         */
        getBusinessDays: function(startDate, endDate) {
            const start = this.parseDate(startDate);
            const end = this.parseDate(endDate);
            
            // 시작 날짜가 종료 날짜보다 큰 경우 교환
            if (start > end) {
                [start, end] = [end, start];
            }
            
            // 하루씩 증가하면서 근무일 계산
            let count = 0;
            const current = new Date(start);
            
            while (current <= end) {
                // 주말이 아닌 경우에만 카운트 증가
                if (!this.isWeekend(current)) {
                    count++;
                }
                
                current.setDate(current.getDate() + 1);
            }
            
            return count;
        },
        
        /**
         * ISO 문자열로 변환
         * 
         * @param {Date|string|number} date - 변환할 날짜
         * @returns {string} - ISO 문자열 (YYYY-MM-DDTHH:mm:ss.sssZ)
         */
        toISOString: function(date) {
            const d = this.parseDate(date);
            return d.toISOString();
        },
        
        /**
         * 날짜를 타임스탬프로 변환
         * 
         * @param {Date|string|number} date - 변환할 날짜
         * @returns {number} - 타임스탬프 (밀리초)
         */
        toTimestamp: function(date) {
            const d = this.parseDate(date);
            return d.getTime();
        },
        
        /**
         * 날짜를 Firebase 타임스탬프 형식으로 변환
         * 
         * @param {Date|string|number} date - 변환할 날짜
         * @returns {object} - Firebase 타임스탬프 객체 { seconds, nanoseconds }
         */
        toFirebaseTimestamp: function(date) {
            const d = this.parseDate(date);
            const seconds = Math.floor(d.getTime() / 1000);
            const nanoseconds = (d.getTime() % 1000) * 1000000;
            
            return { seconds, nanoseconds };
        },
        
        /**
         * 날짜 범위 생성
         * 
         * @param {Date|string|number} startDate - 시작 날짜
         * @param {Date|string|number} endDate - 종료 날짜
         * @param {string} step - 단계 ('day', 'week', 'month', 'year') (기본값: 'day')
         * @returns {Array<Date>} - 날짜 범위 배열
         */
        createDateRange: function(startDate, endDate, step = 'day') {
            const start = this.parseDate(startDate);
            const end = this.parseDate(endDate);
            
            // 시작 날짜가 종료 날짜보다 큰 경우 빈 배열 반환
            if (start > end) {
                return [];
            }
            
            const range = [];
            const current = new Date(start);
            
            while (current <= end) {
                range.push(new Date(current));
                
                // 다음 날짜로 이동
                switch (step) {
                    case 'day':
                        current.setDate(current.getDate() + 1);
                        break;
                    case 'week':
                        current.setDate(current.getDate() + 7);
                        break;
                    case 'month':
                        current.setMonth(current.getMonth() + 1);
                        break;
                    case 'year':
                        current.setFullYear(current.getFullYear() + 1);
                        break;
                    default:
                        current.setDate(current.getDate() + 1);
                }
            }
            
            return range;
        },
        
        /**
         * 한국어 날짜 표현
         * 
         * @param {Date|string|number} date - 표현할 날짜
         * @param {boolean} includeTime - 시간 포함 여부 (기본값: false)
         * @returns {string} - 한국어 날짜 표현
         */
        formatKorean: function(date, includeTime = false) {
            const d = this.parseDate(date);
            
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const day = d.getDate();
            
            let result = `${year}년 ${month}월 ${day}일`;
            
            if (includeTime) {
                const hours = d.getHours();
                const minutes = d.getMinutes();
                
                // 시간 표시 (오전/오후)
                const ampm = hours < 12 ? '오전' : '오후';
                const hour12 = hours % 12 || 12;
                
                result += ` ${ampm} ${hour12}시 ${minutes}분`;
            }
            
            return result;
        },
        
        /**
         * 날짜를 객체로 변환
         * 
         * @param {Date|string|number} date - 변환할 날짜
         * @returns {object} - 날짜 객체 { year, month, day, hours, minutes, seconds, milliseconds }
         */
        toObject: function(date) {
            const d = this.parseDate(date);
            
            return {
                year: d.getFullYear(),
                month: d.getMonth() + 1, // 1-12
                day: d.getDate(),
                hours: d.getHours(),
                minutes: d.getMinutes(),
                seconds: d.getSeconds(),
                milliseconds: d.getMilliseconds()
            };
        }
    };
})();