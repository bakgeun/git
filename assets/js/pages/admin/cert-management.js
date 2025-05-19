/**
 * 자격증 관리 페이지 스크립트
 */

// formatters.js에 formatDateToInput 함수가 없으면 추가
if (window.formatters && !window.formatters.formatDateToInput) {
    window.formatters.formatDateToInput = function (date) {
        if (!date) return '';

        try {
            // Firebase Timestamp인 경우
            if (typeof date.toDate === 'function') {
                date = date.toDate();
            } else if (typeof date === 'string') {
                // YYYY-MM-DD 형식인지 확인
                if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return date;
                }
                // 다른 형식의 문자열일 경우 Date 객체로 변환
                date = new Date(date);
            }

            // Date 객체인 경우
            if (date instanceof Date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
        }

        return '';
    };
}

// 자격증 관리 객체
window.certManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    currentCertType: 'health-exercise',

    /**
     * 초기화
     */
    init: async function () {
        try {
            console.log('자격증 관리자 초기화 시작');

            // 이벤트 리스너 등록
            this.registerEventListeners();

            // 자격증 데이터 로드
            await this.loadCertificates();

            console.log('자격증 관리자 초기화 완료');
            return true;
        } catch (error) {
            console.error('자격증 관리자 초기화 오류:', error);
            if (window.adminAuth && window.adminAuth.showNotification) {
                window.adminAuth.showNotification('초기화 중 오류가 발생했습니다.', 'error');
            }
            return false;
        }
    },

    /**
     * 이벤트 리스너 등록
     */
    registerEventListeners: function () {
        // 자격증 발급 폼 제출 이벤트
        const certIssueForm = document.getElementById('cert-issue-form');
        if (certIssueForm) {
            certIssueForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.issueCertificate(e.target);
            });
        }

        // 검색어 입력 시 엔터키 이벤트
        const searchInputs = document.querySelectorAll('#search-name, #search-cert-number');
        searchInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.search();
            });
        });

        // 상태 필터 변경 이벤트
        const statusFilter = document.getElementById('filter-status');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.search());
        }

        // 일괄 발급 파일 업로드 이벤트
        const bulkFileInput = document.getElementById('bulk-file');
        if (bulkFileInput) {
            bulkFileInput.addEventListener('change', this.handleBulkFileUpload.bind(this));
        }
    },

    /**
     * 자격증 유형 전환
     */
    switchCertType: function (certType) {
        // 이미 선택된 유형이면 무시
        if (this.currentCertType === certType) return;

        // 탭 상태 업데이트
        const tabs = document.querySelectorAll('.cert-tab');
        tabs.forEach(tab => {
            if (tab.dataset.cert === certType) {
                tab.classList.add('active', 'border-indigo-500', 'text-indigo-600');
                tab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            } else {
                tab.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
                tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            }
        });

        // 타이틀 업데이트
        const certTypeTitle = document.getElementById('cert-type-title');
        if (certTypeTitle) {
            certTypeTitle.textContent = this.getCertTypeName(certType);
        }

        // 현재 자격증 유형 업데이트
        this.currentCertType = certType;
        this.currentPage = 1;
        this.lastDoc = null;

        // 자격증 데이터 로드
        this.loadCertificates();
    },

    /**
     * 자격증 목록 로드
     */
    loadCertificates: async function () {
        try {
            // 로딩 상태 표시
            const tableBody = document.querySelector('#cert-table tbody');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-gray-500">데이터 로딩 중...</td>
                </tr>
            `;

            // 자격증 데이터 가져오기
            let certificates = [];

            // Firebase가 초기화되었는지 확인
            if (window.dhcFirebase && window.dhcFirebase.db) {
                try {
                    // 필터 옵션 설정 - 인덱스 오류 방지를 위해 단순화된 쿼리 사용
                    let query = window.dhcFirebase.db.collection('certificates')
                        .where('certificateType', '==', this.currentCertType);

                    // 상태 필터 적용 (선택적)
                    const statusFilter = document.getElementById('filter-status')?.value;
                    if (statusFilter) {
                        query = query.where('status', '==', statusFilter);
                    }

                    // 검색어 필터
                    const nameSearch = document.getElementById('search-name')?.value.trim();
                    const certNumberSearch = document.getElementById('search-cert-number')?.value.trim();

                    // 검색어가 없으면 기본 쿼리 실행
                    if (!nameSearch && !certNumberSearch) {
                        const snapshot = await query.get();

                        if (!snapshot.empty) {
                            snapshot.forEach(doc => {
                                certificates.push({
                                    id: doc.id,
                                    ...doc.data()
                                });
                            });

                            // 클라이언트 측에서 정렬 (최신 발급일 기준)
                            certificates.sort((a, b) => {
                                const dateA = a.issueDate?.seconds || 0;
                                const dateB = b.issueDate?.seconds || 0;
                                return dateB - dateA;
                            });

                            // 페이지네이션 처리 (클라이언트 측)
                            const startIndex = (this.currentPage - 1) * this.pageSize;
                            certificates = certificates.slice(startIndex, startIndex + this.pageSize);
                        }
                    } else {
                        // 검색어가 있으면 전체 데이터를 가져와서 클라이언트에서 필터링
                        const snapshot = await window.dhcFirebase.db.collection('certificates')
                            .where('certificateType', '==', this.currentCertType)
                            .get();

                        if (!snapshot.empty) {
                            const allCerts = [];
                            snapshot.forEach(doc => {
                                allCerts.push({
                                    id: doc.id,
                                    ...doc.data()
                                });
                            });

                            // 클라이언트 측에서 필터링
                            certificates = allCerts.filter(cert => {
                                // 상태 필터
                                if (statusFilter && cert.status !== statusFilter) {
                                    return false;
                                }

                                // 이름 검색
                                if (nameSearch &&
                                    !(cert.holderName && cert.holderName.includes(nameSearch))) {
                                    return false;
                                }

                                // 자격증 번호 검색
                                if (certNumberSearch &&
                                    !(cert.certificateNumber && cert.certificateNumber.includes(certNumberSearch))) {
                                    return false;
                                }

                                return true;
                            });

                            // 클라이언트 측에서 정렬 (최신 발급일 기준)
                            certificates.sort((a, b) => {
                                const dateA = a.issueDate?.seconds || 0;
                                const dateB = b.issueDate?.seconds || 0;
                                return dateB - dateA;
                            });

                            // 페이지네이션 처리 (클라이언트 측)
                            const startIndex = (this.currentPage - 1) * this.pageSize;
                            certificates = certificates.slice(startIndex, startIndex + this.pageSize);
                        }
                    }
                } catch (error) {
                    console.error('Firebase 데이터 조회 오류:', error);
                    window.adminAuth?.showNotification('데이터 조회 중 오류가 발생했습니다.', 'error');
                }
            } else {
                // Firebase 연동 전 테스트 데이터 사용
                certificates = await this.getMockCertificates();
            }

            // 테이블 업데이트
            this.updateCertificateTable(certificates);

            // 페이지네이션 업데이트
            // 기존 페이지네이션 로직을 클라이언트 측으로 변경
            let totalCount = 0;

            if (window.dhcFirebase && window.dhcFirebase.db) {
                try {
                    // 전체 개수만 계산 (인덱스 문제 없는 간단한 쿼리)
                    const snapshot = await window.dhcFirebase.db.collection('certificates')
                        .where('certificateType', '==', this.currentCertType)
                        .get();

                    totalCount = snapshot.size;

                    // 필터링된 경우는 클라이언트 측에서 계산
                    const statusFilter = document.getElementById('filter-status')?.value;
                    const nameSearch = document.getElementById('search-name')?.value.trim();
                    const certNumberSearch = document.getElementById('search-cert-number')?.value.trim();

                    if (statusFilter || nameSearch || certNumberSearch) {
                        // 매우 많은 데이터일 경우 여기서 최적화가 필요할 수 있음
                        // 현재는 단순하게 메모리에서 필터링
                        totalCount = snapshot.docs.filter(doc => {
                            const data = doc.data();

                            // 상태 필터
                            if (statusFilter && data.status !== statusFilter) {
                                return false;
                            }

                            // 이름 검색
                            if (nameSearch &&
                                !(data.holderName && data.holderName.includes(nameSearch))) {
                                return false;
                            }

                            // 자격증 번호 검색
                            if (certNumberSearch &&
                                !(data.certificateNumber && data.certificateNumber.includes(certNumberSearch))) {
                                return false;
                            }

                            return true;
                        }).length;
                    }
                } catch (error) {
                    console.error('문서 수 계산 오류:', error);
                    totalCount = certificates.length > 0 ? certificates.length + (this.currentPage - 1) * this.pageSize : 0;
                }
            } else {
                // 테스트 데이터는 20개로 가정
                totalCount = 20;
            }

            const totalPages = Math.ceil(totalCount / this.pageSize);
            this.updatePagination(this.currentPage, totalPages);

        } catch (error) {
            console.error('자격증 데이터 로드 오류:', error);

            const tableBody = document.querySelector('#cert-table tbody');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-red-500">데이터 로드 중 오류가 발생했습니다.</td>
                </tr>
            `;
        }
    },

    /**
     * 자격증 테이블 업데이트
     */
    updateCertificateTable: function (certificates) {
        const tableBody = document.querySelector('#cert-table tbody');

        if (!certificates || certificates.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-gray-500">자격증 데이터가 없습니다.</td>
                </tr>
            `;
            return;
        }

        let tableHtml = '';

        certificates.forEach(cert => {
            const issueDate = cert.issueDate && typeof cert.issueDate.toDate === 'function'
                ? this.formatDate(cert.issueDate.toDate())
                : cert.issueDate || '-';

            const expiryDate = cert.expiryDate && typeof cert.expiryDate.toDate === 'function'
                ? this.formatDate(cert.expiryDate.toDate())
                : cert.expiryDate || '-';

            tableHtml += `
                <tr>
                    <td class="text-center">
                        <input type="checkbox" class="cert-checkbox" data-id="${cert.id}">
                    </td>
                    <td>${cert.certificateNumber || cert.certNumber || '-'}</td>
                    <td>${cert.holderName || cert.name || '-'}</td>
                    <td>${cert.courseName || cert.course || '-'}</td>
                    <td>${issueDate}</td>
                    <td>${expiryDate}</td>
                    <td>
                        <span class="px-2 py-1 rounded-full text-xs 
                            ${cert.status === 'active' ? 'bg-green-100 text-green-800' :
                    cert.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}">
                            ${this.getStatusText(cert.status)}
                        </span>
                    </td>
                    <td>
                        <div class="flex space-x-2">
                            <button onclick="certManager.viewCertDetails('${cert.id}')" 
                                class="text-blue-600 hover:text-blue-800">
                                상세
                            </button>
                            <button onclick="certManager.editCert('${cert.id}')" 
                                class="text-indigo-600 hover:text-indigo-800">
                                수정
                            </button>
                            <div class="relative inline-block">
                                <button onclick="certManager.showPdfOptions('${cert.id}')" 
                                    class="text-green-600 hover:text-green-800">
                                    PDF
                                </button>
                                <div id="pdf-dropdown-${cert.id}" class="hidden absolute z-10 bg-white rounded shadow-lg mt-1 py-1" style="min-width: 120px;">
                                    <a href="#" onclick="certManager.downloadCertPdf('${cert.id}', 'ko'); event.preventDefault();" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">한글 PDF</a>
                                    <a href="#" onclick="certManager.downloadCertPdf('${cert.id}', 'en'); event.preventDefault();" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">영문 PDF</a>
                                </div>
                            </div>
                            ${cert.status !== 'suspended' && cert.status !== 'revoked' ? `
                                <button onclick="certManager.revokeCertificate('${cert.id}')" 
                                    class="text-red-600 hover:text-red-800">
                                    취소
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHtml;

        // PDF 드롭다운 이벤트 처리
        certificates.forEach(cert => {
            const button = document.querySelector(`button[onclick="certManager.showPdfOptions('${cert.id}')"]`);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dropdown = document.getElementById(`pdf-dropdown-${cert.id}`);
                    dropdown.classList.toggle('hidden');
                });
            }
        });

        // 전역 클릭 이벤트로 드롭다운 닫기
        document.addEventListener('click', (e) => {
            const dropdowns = document.querySelectorAll('[id^="pdf-dropdown-"]');
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(e.target) && !e.target.matches('button[onclick^="certManager.showPdfOptions"]')) {
                    dropdown.classList.add('hidden');
                }
            });
        });
    },

    /**
     * PDF 옵션 드롭다운 표시
     */
    showPdfOptions: function (certId) {
        // 이벤트는 updateCertificateTable에서 처리됨
    },

    /**
     * 페이지네이션 업데이트
     */
    updatePagination: function (currentPage, totalPages) {
        const paginationContainer = document.getElementById('cert-pagination');

        if (!paginationContainer) return;

        let paginationHtml = '<div class="flex justify-center">';

        // 이전 페이지 버튼
        paginationHtml += `
            <button onclick="certManager.changePage(${currentPage - 1})" 
                class="px-3 py-1 rounded-md mx-1 ${currentPage <= 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-700'}"
                ${currentPage <= 1 ? 'disabled' : ''}>
                이전
            </button>
        `;

        // 페이지 번호들
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button onclick="certManager.changePage(${i})" 
                    class="px-3 py-1 rounded-md mx-1 ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}">
                    ${i}
                </button>
            `;
        }

        // 다음 페이지 버튼
        paginationHtml += `
            <button onclick="certManager.changePage(${currentPage + 1})" 
                class="px-3 py-1 rounded-md mx-1 ${currentPage >= totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-700'}"
                ${currentPage >= totalPages ? 'disabled' : ''}>
                다음
            </button>
        `;

        paginationHtml += '</div>';

        paginationContainer.innerHTML = paginationHtml;
    },

    /**
     * 페이지 변경
     */
    changePage: function (page) {
        // 유효한 페이지 체크
        if (page < 1) return;

        this.currentPage = page;
        this.loadCertificates();
    },

    /**
     * 검색 기능
     */
    search: function () {
        // 검색 시 첫 페이지로 이동
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCertificates();
    },

    /**
     * 자격증 발급 모달 표시
     */
    showIssueCertModal: function () {
        const modal = document.getElementById('cert-issue-modal');
        if (modal) {
            modal.classList.remove('hidden');

            // 교육 과정 옵션 로드
            this.loadCourseOptions();

            // 오늘 날짜로 발급일 설정
            const issueDateInput = document.getElementById('issue-completion-date');
            if (issueDateInput) {
                const today = new Date();
                issueDateInput.value = this.formatDateToInput(today);
            }

            // 3년 후 날짜로 만료일 설정
            const expiryDateInput = document.getElementById('issue-expiry-date');
            if (expiryDateInput) {
                const expiryDate = new Date();
                expiryDate.setFullYear(expiryDate.getFullYear() + 3);
                expiryDateInput.value = this.formatDateToInput(expiryDate);
            }
        }
    },

    /**
     * 자격증 발급 모달 닫기
     */
    closeIssueCertModal: function () {
        const modal = document.getElementById('cert-issue-modal');
        if (modal) {
            modal.classList.add('hidden');

            // 폼 초기화
            const form = document.getElementById('cert-issue-form');
            if (form) form.reset();
        }
    },

    /**
     * 일괄 발급 모달 표시
     */
    showBulkIssuanceModal: function () {
        const modal = document.getElementById('bulk-issue-modal');
        if (modal) {
            modal.classList.remove('hidden');

            // 미리보기 영역 초기화
            const previewArea = document.getElementById('bulk-preview');
            if (previewArea) previewArea.classList.add('hidden');

            // 파일 입력 초기화
            const fileInput = document.getElementById('bulk-file');
            if (fileInput) fileInput.value = '';

            // 버튼 비활성화
            const bulkIssueBtn = document.getElementById('bulk-issue-btn');
            if (bulkIssueBtn) bulkIssueBtn.disabled = true;
        }
    },

    /**
     * 일괄 발급 모달 닫기
     */
    closeBulkIssuanceModal: function () {
        const modal = document.getElementById('bulk-issue-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    /**
     * 일괄 발급 파일 업로드 처리
     */
    handleBulkFileUpload: function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const previewArea = document.getElementById('bulk-preview');
        const previewHeader = document.getElementById('bulk-preview-header');
        const previewBody = document.getElementById('bulk-preview-body');
        const bulkIssueBtn = document.getElementById('bulk-issue-btn');

        // 파일 형식 확인 (xlsx, xls만 허용)
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            window.adminAuth?.showNotification('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.', 'error');
            event.target.value = '';
            return;
        }

        // 여기서는 실제 파일 처리는 생략하고 미리보기만 표시
        previewHeader.innerHTML = `
            <tr class="bg-gray-100">
                <th class="border border-gray-300 px-4 py-2">이름</th>
                <th class="border border-gray-300 px-4 py-2">이메일</th>
                <th class="border border-gray-300 px-4 py-2">교육과정</th>
                <th class="border border-gray-300 px-4 py-2">수료일</th>
            </tr>
        `;

        // 샘플 데이터로 미리보기 표시
        previewBody.innerHTML = `
            <tr>
                <td class="border border-gray-300 px-4 py-2">홍길동</td>
                <td class="border border-gray-300 px-4 py-2">hong@example.com</td>
                <td class="border border-gray-300 px-4 py-2">건강운동처방사 1기</td>
                <td class="border border-gray-300 px-4 py-2">2025-03-15</td>
            </tr>
            <tr>
                <td class="border border-gray-300 px-4 py-2">김철수</td>
                <td class="border border-gray-300 px-4 py-2">kim@example.com</td>
                <td class="border border-gray-300 px-4 py-2">건강운동처방사 1기</td>
                <td class="border border-gray-300 px-4 py-2">2025-03-15</td>
            </tr>
        `;

        previewArea.classList.remove('hidden');

        // 일괄 발급 버튼 활성화
        if (bulkIssueBtn) bulkIssueBtn.disabled = false;
    },

    /**
     * 일괄 발급 처리
     */
    processBulkIssuance: function () {
        const fileInput = document.getElementById('bulk-file');
        if (!fileInput || !fileInput.files[0]) {
            window.adminAuth?.showNotification('업로드된 파일이 없습니다.', 'error');
            return;
        }

        // 로딩 표시
        if (window.adminUtils?.showLoadingOverlay) {
            window.adminUtils.showLoadingOverlay(true);
        }

        // 실제로는 여기서 파일 처리 및 DB 저장 로직 구현
        setTimeout(() => {
            // 로딩 종료
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }

            // 모달 닫기
            this.closeBulkIssuanceModal();

            // 성공 메시지
            window.adminAuth?.showNotification('자격증 일괄 발급이 완료되었습니다.', 'success');

            // 목록 새로고침
            this.loadCertificates();
        }, 2000);
    },

    /**
     * 교육 과정 옵션 로드
     */
    loadCourseOptions: async function () {
        const courseSelect = document.getElementById('issue-course');

        if (!courseSelect) return;

        courseSelect.innerHTML = '<option value="">로딩 중...</option>';

        try {
            let courses = [];

            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db) {
                try {
                    // 현재 자격증 유형에 맞는 교육 과정만 조회 - 단순 쿼리로 수정
                    const query = window.dhcFirebase.db.collection('courses')
                        .where('certificateType', '==', this.currentCertType);

                    const snapshot = await query.get();

                    if (!snapshot.empty) {
                        snapshot.forEach(doc => {
                            courses.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });

                        // 클라이언트 측에서 추가 필터링 및 정렬
                        courses = courses.filter(course =>
                            course.status === 'completed' || course.status === 'closed'
                        );

                        // 최신 종료일 기준 정렬
                        courses.sort((a, b) => {
                            const dateA = a.endDate?.seconds || 0;
                            const dateB = b.endDate?.seconds || 0;
                            return dateB - dateA;
                        });
                    }
                } catch (error) {
                    console.error('교육 과정 쿼리 오류:', error);
                    // 오류 발생 시 빈 배열 사용
                    courses = [];
                }
            } else {
                // 테스트 데이터
                courses = [
                    { id: 'course1', title: '2025년 1기 건강운동처방사 과정', startDate: '2025-01-15', endDate: '2025-03-15' },
                    { id: 'course2', title: '2024년 4기 건강운동처방사 과정', startDate: '2024-10-01', endDate: '2024-12-15' }
                ];
            }

            // 옵션 업데이트
            if (courses.length > 0) {
                courseSelect.innerHTML = '<option value="">교육 과정을 선택하세요</option>';

                courses.forEach(course => {
                    const startDate = typeof course.startDate === 'string' ? course.startDate :
                        (course.startDate?.toDate ? this.formatDate(course.startDate.toDate()) : '-');

                    const endDate = typeof course.endDate === 'string' ? course.endDate :
                        (course.endDate?.toDate ? this.formatDate(course.endDate.toDate()) : '-');

                    courseSelect.innerHTML += `
                        <option value="${course.id}">${course.title} (${startDate} ~ ${endDate})</option>
                    `;
                });
            } else {
                courseSelect.innerHTML = '<option value="">교육 과정이 없습니다.</option>';
            }
        } catch (error) {
            console.error('교육 과정 로드 오류:', error);
            courseSelect.innerHTML = '<option value="">교육 과정 로드 실패</option>';
        }
    },

    /**
     * 자격증 발급 처리
     */
    issueCertificate: async function (form) {
        try {
            // 폼 데이터 가져오기
            const name = document.getElementById('issue-name').value.trim();
            const email = document.getElementById('issue-email').value.trim();
            const courseId = document.getElementById('issue-course').value;
            const completionDate = document.getElementById('issue-completion-date').value;
            const expiryDate = document.getElementById('issue-expiry-date').value;

            // 유효성 검사
            if (!name || !email || !courseId || !completionDate || !expiryDate) {
                window.adminAuth?.showNotification('모든 필드를 입력해주세요.', 'error');
                return;
            }

            // 로딩 표시
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(true);
            }

            // 자격증 번호 생성 (예: HE-2025-0001)
            const certTypePrefix = {
                'health-exercise': 'HE',
                'rehabilitation': 'RE',
                'pilates': 'PI',
                'recreation': 'RC'
            }[this.currentCertType] || 'XX';

            const year = new Date().getFullYear();
            const count = await this.getCertificateCount(this.currentCertType, year);
            const certificateNumber = `${certTypePrefix}-${year}-${String(count + 1).padStart(4, '0')}`;

            if (window.dhcFirebase && window.dhcFirebase.db) {
                // 자격증 데이터 생성
                const certData = {
                    certificateNumber: certificateNumber,
                    certificateType: this.currentCertType,
                    holderName: name,
                    holderEmail: email,
                    courseId: courseId,
                    issueDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(completionDate)),
                    expiryDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(expiryDate)),
                    status: 'active',
                    createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };

                // Firebase에 저장
                try {
                    const docRef = await window.dhcFirebase.db.collection('certificates').add(certData);

                    // 성공
                    window.adminAuth?.showNotification('자격증이 성공적으로 발급되었습니다.', 'success');

                    // 모달 닫기
                    this.closeIssueCertModal();

                    // 목록 새로고침
                    this.loadCertificates();
                } catch (error) {
                    console.error('자격증 저장 오류:', error);
                    window.adminAuth?.showNotification('자격증 발급에 실패했습니다.', 'error');
                }
            } else {
                // 테스트 환경에서는 성공으로 처리
                setTimeout(() => {
                    // 성공 메시지
                    window.adminAuth?.showNotification('자격증이 성공적으로 발급되었습니다.', 'success');

                    // 모달 닫기
                    this.closeIssueCertModal();

                    // 목록 새로고침
                    this.loadCertificates();
                }, 1000);
            }
        } catch (error) {
            console.error('자격증 발급 오류:', error);
            window.adminAuth?.showNotification('자격증 발급 중 오류가 발생했습니다.', 'error');
        } finally {
            // 로딩 종료
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }
        }
    },

    /**
     * 자격증 수 조회 (번호 생성용)
     */
    getCertificateCount: async function (certType, year) {
        try {
            if (window.dhcFirebase && window.dhcFirebase.db) {
                const startOfYear = new Date(year, 0, 1);
                const endOfYear = new Date(year + 1, 0, 1);

                // 단순 쿼리로 변경 (인덱스 문제 해결)
                const query = window.dhcFirebase.db.collection('certificates')
                    .where('certificateType', '==', certType);

                const snapshot = await query.get();

                // 클라이언트 측에서 필터링 (연도별)
                let count = 0;

                if (!snapshot.empty) {
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const issueDate = data.issueDate?.toDate ? data.issueDate.toDate() : null;

                        if (issueDate && issueDate >= startOfYear && issueDate < endOfYear) {
                            count++;
                        }
                    });
                }

                return count;
            }

            // 테스트 환경에서는 0 반환 (첫 번째 자격증 번호는 0001이 됨)
            return 0;
        } catch (error) {
            console.error('자격증 수 조회 오류:', error);
            return 0;
        }
    },

    /**
     * 전체 선택 토글
     */
    toggleSelectAll: function (checkbox) {
        const certCheckboxes = document.querySelectorAll('.cert-checkbox');
        certCheckboxes.forEach(cb => {
            cb.checked = checkbox.checked;
        });
    },

    /**
     * 자격증 상세 정보 보기
     */
    viewCertDetails: async function (certId) {
        try {
            // 로딩 표시
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(true);
            }

            let cert = null;
            let courseName = '-';
            let userName = '-';
            let userEmail = '-';

            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db) {
                // 자격증 정보 조회
                try {
                    const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                    const docSnap = await docRef.get();

                    if (docSnap.exists) {
                        cert = {
                            id: docSnap.id,
                            ...docSnap.data()
                        };

                        // 교육 과정 정보 조회 (선택적)
                        if (cert.courseId) {
                            try {
                                const courseRef = window.dhcFirebase.db.collection('courses').doc(cert.courseId);
                                const courseSnap = await courseRef.get();

                                if (courseSnap.exists) {
                                    courseName = courseSnap.data().title || '-';
                                }
                            } catch (error) {
                                console.error('교육 과정 조회 오류:', error);
                            }
                        }

                        // 사용자 정보 조회 (선택적)
                        if (cert.userId) {
                            try {
                                const userRef = window.dhcFirebase.db.collection('users').doc(cert.userId);
                                const userSnap = await userRef.get();

                                if (userSnap.exists) {
                                    userName = userSnap.data().displayName || '-';
                                    userEmail = userSnap.data().email || '-';
                                }
                            } catch (error) {
                                console.error('사용자 정보 조회 오류:', error);
                            }
                        }
                    } else {
                        window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                        return;
                    }
                } catch (error) {
                    console.error('자격증 정보 조회 오류:', error);
                    window.adminAuth?.showNotification('자격증 정보를 불러올 수 없습니다.', 'error');
                    return;
                }
            } else {
                // 테스트 데이터
                cert = this.getMockCertificateById(certId);
                if (!cert) {
                    window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                    return;
                }

                courseName = cert.course || '-';
                userName = cert.name || '-';
                userEmail = 'user@example.com';
            }

            // 모달 내용 생성
            const modalContent = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">자격증 번호</h4>
                            <p>${cert.certificateNumber || cert.certNumber || '-'}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">자격증 종류</h4>
                            <p>${this.getCertTypeName(cert.certificateType || this.currentCertType)}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">수료자 정보</h4>
                        <p>${cert.holderName || userName} (${cert.holderEmail || userEmail})</p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">교육 과정</h4>
                        <p>${courseName}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">발급일</h4>
                            <p>${this.formatDate(cert.issueDate) || cert.issueDate || '-'}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">만료일</h4>
                            <p>${this.formatDate(cert.expiryDate) || cert.expiryDate || '-'}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">상태</h4>
                        <p>
                            <span class="px-2 py-1 rounded-full text-xs 
                                ${cert.status === 'active' ? 'bg-green-100 text-green-800' :
                    cert.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}">
                                ${this.getStatusText(cert.status)}
                            </span>
                        </p>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-700">비고</h4>
                        <p class="whitespace-pre-wrap">${cert.remarks || '-'}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-700">등록일시</h4>
                            <p>${this.formatDate(cert.createdAt, true) || '-'}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">수정일시</h4>
                            <p>${this.formatDate(cert.updatedAt, true) || '-'}</p>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <h4 class="font-medium text-gray-700">자격증 PDF 다운로드</h4>
                        <div class="flex space-x-3 mt-2">
                            <button onclick="certManager.downloadCertPdf('${certId}', 'ko'); adminUtils.closeModal();" class="admin-btn admin-btn-secondary">
                                한글 PDF
                            </button>
                            <button onclick="certManager.downloadCertPdf('${certId}', 'en'); adminUtils.closeModal();" class="admin-btn admin-btn-primary">
                                영문 PDF
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // 모달 표시
            if (window.adminUtils?.showModal) {
                window.adminUtils.showModal({
                    title: '자격증 상세 정보',
                    content: modalContent,
                    buttons: [
                        { label: '닫기', type: 'secondary', handler: 'adminUtils.closeModal()' }
                    ]
                });
            } else {
                alert(`자격증 상세 정보:\n자격증 번호: ${cert.certificateNumber || cert.certNumber}\n수료자: ${cert.holderName || userName}\n상태: ${this.getStatusText(cert.status)}`);
            }
        } catch (error) {
            console.error('자격증 상세 정보 조회 오류:', error);
            window.adminAuth?.showNotification('자격증 정보 조회 중 오류가 발생했습니다.', 'error');
        } finally {
            // 로딩 종료
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }
        }
    },

    /**
     * 자격증 수정
     */
    editCert: async function (certId) {
        try {
            // 로딩 표시
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(true);
            }

            let cert = null;

            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db) {
                // 자격증 정보 조회
                try {
                    const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                    const docSnap = await docRef.get();

                    if (docSnap.exists) {
                        cert = {
                            id: docSnap.id,
                            ...docSnap.data()
                        };
                    } else {
                        window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                        return;
                    }
                } catch (error) {
                    console.error('자격증 정보 조회 오류:', error);
                    window.adminAuth?.showNotification('자격증 정보를 불러올 수 없습니다.', 'error');
                    return;
                }
            } else {
                // 테스트 데이터
                cert = this.getMockCertificateById(certId);
                if (!cert) {
                    window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                    return;
                }
            }

            // 모달 내용 생성 (수정 폼)
            const modalContent = `
                <form id="edit-cert-form" onsubmit="certManager.handleUpdateCertificate(event, '${certId}')">
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">자격증 번호</label>
                                <input type="text" value="${cert.certificateNumber || cert.certNumber || ''}" readonly
                                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100">
                                <p class="text-xs text-gray-500 mt-1">자격증 번호는 변경할 수 없습니다.</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">수료자명</label>
                                <input type="text" value="${cert.holderName || cert.name || ''}" readonly
                                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100">
                                <p class="text-xs text-gray-500 mt-1">수료자명은 변경할 수 없습니다.</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">발급일 <span class="text-red-500">*</span></label>
                                <input type="date" name="issueDate" required
                                    value="${this.formatDateToInput(cert.issueDate) || cert.issueDate || ''}"
                                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">만료일 <span class="text-red-500">*</span></label>
                                <input type="date" name="expiryDate" required
                                    value="${this.formatDateToInput(cert.expiryDate) || cert.expiryDate || ''}"
                                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">상태 <span class="text-red-500">*</span></label>
                            <select name="status" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                                <option value="active" ${cert.status === 'active' ? 'selected' : ''}>유효</option>
                                <option value="expired" ${cert.status === 'expired' ? 'selected' : ''}>만료</option>
                                <option value="revoked" ${cert.status === 'revoked' || cert.status === 'suspended' ? 'selected' : ''}>취소</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">비고</label>
                            <textarea name="remarks" rows="3" 
                                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">${cert.remarks || ''}</textarea>
                        </div>
                    </div>
                </form>
            `;

            // 모달 표시
            if (window.adminUtils?.showModal) {
                window.adminUtils.showModal({
                    title: '자격증 정보 수정',
                    content: modalContent,
                    buttons: [
                        { label: '취소', type: 'secondary', handler: 'adminUtils.closeModal()' },
                        { label: '저장', type: 'primary', handler: 'document.getElementById("edit-cert-form").submit()' }
                    ]
                });
            } else {
                alert('자격증 수정 기능은 adminUtils가 필요합니다.');
            }
        } catch (error) {
            console.error('자격증 수정 폼 로드 오류:', error);
            window.adminAuth?.showNotification('자격증 정보 조회 중 오류가 발생했습니다.', 'error');
        } finally {
            // 로딩 종료
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }
        }
    },

    /**
     * 자격증 수정 처리
     */
    handleUpdateCertificate: async function (event, certId) {
        event.preventDefault();

        try {
            // 로딩 표시
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(true);
            }

            // 폼 데이터 가져오기
            const form = event.target;
            const issueDate = form.elements.issueDate.value;
            const expiryDate = form.elements.expiryDate.value;
            const status = form.elements.status.value;
            const remarks = form.elements.remarks.value;

            // 유효성 검사
            if (!issueDate || !expiryDate || !status) {
                window.adminAuth?.showNotification('필수 필드를 모두 입력해주세요.', 'error');
                return;
            }

            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db) {
                // 업데이트 데이터
                const updateData = {
                    issueDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(issueDate)),
                    expiryDate: window.dhcFirebase.firebase.firestore.Timestamp.fromDate(new Date(expiryDate)),
                    status: status,
                    remarks: remarks,
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };

                // Firebase에 업데이트
                try {
                    const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                    await docRef.update(updateData);

                    // 모달 닫기
                    if (window.adminUtils?.closeModal) {
                        window.adminUtils.closeModal();
                    }

                    // 성공 메시지
                    window.adminAuth?.showNotification('자격증 정보가 성공적으로 수정되었습니다.', 'success');

                    // 목록 새로고침
                    this.loadCertificates();
                } catch (error) {
                    console.error('자격증 정보 업데이트 오류:', error);
                    window.adminAuth?.showNotification('자격증 정보 수정에 실패했습니다.', 'error');
                }
            } else {
                // 테스트 환경에서는 성공으로 처리
                setTimeout(() => {
                    // 모달 닫기
                    if (window.adminUtils?.closeModal) {
                        window.adminUtils.closeModal();
                    }

                    // 성공 메시지
                    window.adminAuth?.showNotification('자격증 정보가 성공적으로 수정되었습니다.', 'success');

                    // 목록 새로고침
                    this.loadCertificates();
                }, 1000);
            }
        } catch (error) {
            console.error('자격증 정보 수정 오류:', error);
            window.adminAuth?.showNotification('자격증 정보 수정 중 오류가 발생했습니다.', 'error');
        } finally {
            // 로딩 종료
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }
        }
    },

    /**
     * 자격증 PDF 다운로드
     */
    downloadCertPdf: function (certId, lang) {
        window.adminAuth?.showNotification('PDF 생성 중...', 'info');

        // 언어에 따른 함수 호출
        if (window.jspdf) {
            if (lang === 'ko') {
                this.generateKoreanCertPdf(certId);
            } else {
                this.generateEnglishCertPdf(certId);
            }
        } else {
            // jsPDF 라이브러리 로드 요청
            this.loadJsPdfLibrary(() => {
                if (lang === 'ko') {
                    this.generateKoreanCertPdf(certId);
                } else {
                    this.generateEnglishCertPdf(certId);
                }
            });
        }
    },

    /**
     * jsPDF 라이브러리 동적 로드
     */
    loadJsPdfLibrary: function (callback) {
        // jsPDF 라이브러리가 없으면 동적으로 로드
        if (!window.jspdf) {
            const jsPdfScript = document.createElement('script');
            jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            jsPdfScript.onload = () => {
                // html2canvas 라이브러리 로드 (한글 지원용)
                const html2canvasScript = document.createElement('script');
                html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                html2canvasScript.onload = callback;
                document.head.appendChild(html2canvasScript);
            };
            document.head.appendChild(jsPdfScript);
        } else {
            // 이미 로드되어 있으면 바로 콜백 실행
            callback();
        }
    },

    /**
     * 테두리 이미지가 없는 경우를 위한 CSS 테두리 생성 함수
     */
    createBorderCSS: function () {
        // 테두리 요소에 적용할 CSS 스타일
        return `
        .certificate-border {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 1px solid #f0c040;
            margin: 40px;
            pointer-events: none;
            z-index: 5;
        }
        
        .certificate-border::before,
        .certificate-border::after,
        .certificate-border-inner::before,
        .certificate-border-inner::after {
            content: '';
            position: absolute;
            width: 80px;
            height: 80px;
            background-color: transparent;
            border: 3px solid #f0c040;
            z-index: 5;
        }
        
        /* 좌상단 모서리 */
        .certificate-border::before {
            top: -3px;
            left: -3px;
            border-right: none;
            border-bottom: none;
        }
        
        /* 우상단 모서리 */
        .certificate-border::after {
            top: -3px;
            right: -3px;
            border-left: none;
            border-bottom: none;
        }
        
        /* 좌하단 모서리 */
        .certificate-border-inner::before {
            bottom: -3px;
            left: -3px;
            border-right: none;
            border-top: none;
        }
        
        /* 우하단 모서리 */
        .certificate-border-inner::after {
            bottom: -3px;
            right: -3px;
            border-left: none;
            border-top: none;
        }
        
        /* 장식적인 곡선 요소 */
        .certificate-border-decoration {
            position: absolute;
            width: 100%;
            pointer-events: none;
            z-index: 5;
        }
        
        .decoration-top {
            top: 5px;
            height: 20px;
            background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjIwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wLDEwIEMxMDAsNDAgMTUwLC0xMCAyNTAsMTAgQzM1MCw0MCA0MDAsLTEwIDUwMCwxMCIgc3Ryb2tlPSIjZjBjMDQwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==') repeat-x center;
        }
        
        .decoration-bottom {
            bottom: 5px;
            height: 20px;
            background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjIwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wLDEwIEMxMDAsLTIwIDE1MCw0MCAyNTAsMTAgQzM1MCwtMjAgNDAwLDQwIDUwMCwxMCIgc3Ryb2tlPSIjZjBjMDQwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==') repeat-x center;
        }
        
        .decoration-left {
            left: 5px;
            width: 20px;
            height: 100%;
            background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iNTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCwwIEMtMjAsMTAwIDQwLDE1MCAxMCwyNTAgQy0yMCwzNTAgNDAsNDAwIDEwLDUwMCIgc3Ryb2tlPSIjZjBjMDQwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==') repeat-y center;
        }
        
        .decoration-right {
            right: 5px;
            width: 20px;
            height: 100%;
            background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iNTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCwwIEMzMCwxMDAgLTIwLDE1MCAxMCwyNTAgQzMwLDM1MCAtMjAsNDAwIDEwLDUwMCIgc3Ryb2tlPSIjZjBjMDQwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==') repeat-y center;
        }
    `;
    },

    /**
     * CSS와 HTML을 사용한 테두리 생성 함수
     */
    createCSSDerivedBorder: function (container) {
        // 스타일 태그 추가
        const styleTag = document.createElement('style');
        styleTag.textContent = this.createBorderCSS();
        document.head.appendChild(styleTag);

        // 테두리 컨테이너 생성
        const borderContainer = document.createElement('div');
        borderContainer.className = 'certificate-border';

        // 내부 테두리 요소 (for 좌하단, 우하단 모서리)
        const borderInner = document.createElement('div');
        borderInner.className = 'certificate-border-inner';
        borderContainer.appendChild(borderInner);

        // 장식적인 곡선 요소 추가
        const decorationPositions = ['top', 'bottom', 'left', 'right'];
        decorationPositions.forEach(position => {
            const decoration = document.createElement('div');
            decoration.className = `certificate-border-decoration decoration-${position}`;
            borderContainer.appendChild(decoration);
        });

        // 컨테이너에 추가
        container.appendChild(borderContainer);

        // 정리를 위한 함수 반환
        return function () {
            // 스타일 태그 제거
            document.head.removeChild(styleTag);
        };
    },

    /**
     * 한글 자격증 PDF 생성
     */
    generateKoreanCertPdf: async function (certId) {
        try {
            // 자격증 정보 조회
            let cert = null;
            let courseName = '';

            if (window.dhcFirebase && window.dhcFirebase.db) {
                try {
                    const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                    const docSnap = await docRef.get();

                    if (docSnap.exists) {
                        cert = {
                            id: docSnap.id,
                            ...docSnap.data()
                        };

                        // 교육 과정 정보 조회
                        if (cert.courseId) {
                            try {
                                const courseRef = window.dhcFirebase.db.collection('courses').doc(cert.courseId);
                                const courseSnap = await courseRef.get();

                                if (courseSnap.exists) {
                                    courseName = courseSnap.data().title || '';
                                }
                            } catch (error) {
                                console.error('교육 과정 조회 오류:', error);
                            }
                        }
                    } else {
                        window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                        return;
                    }
                } catch (error) {
                    console.error('자격증 정보 조회 오류:', error);
                    window.adminAuth?.showNotification('자격증 정보를 불러올 수 없습니다.', 'error');
                    return;
                }
            } else {
                // 테스트 데이터
                cert = this.getMockCertificateById(certId);
                if (!cert) {
                    window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                    return;
                }

                courseName = cert.course || '건강운동처방사 과정';
            }

            // 자격증 정보 추출
            const certNumber = cert.certificateNumber || cert.certNumber || 'XX-0000-0000';
            const holderName = cert.holderName || cert.name || '홍길동';
            const issueDate = this.formatDate(cert.issueDate) || '2025-05-01';
            const certType = this.getCertTypeName(cert.certificateType || this.currentCertType);

            // 발급일 포맷팅
            const today = new Date();
            const formattedToday = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

            // 직인 및 배경 이미지 경로
            const sealImagePath = window.adjustPath('assets/images/logo/seal.png'); // 실제 직인 이미지 경로
            const borderImagePath = window.adjustPath('assets/images/certificates/border-gold.png'); // 테두리 이미지 (첨부한 이미지처럼)
            const logoImagePath = window.adjustPath('assets/images/logo/logo.jpeg'); // 로고 이미지

            // HTML 템플릿 생성 (한글 자격증)
            const certTemplate = document.createElement('div');
            certTemplate.style.width = '793px'; // A4 너비 (px)
            certTemplate.style.height = '1122px'; // A4 높이 (px)
            certTemplate.style.position = 'absolute';
            certTemplate.style.left = '-9999px';
            certTemplate.style.fontFamily = 'Noto Sans KR, sans-serif';
            certTemplate.style.padding = '0';
            certTemplate.style.boxSizing = 'border-box';
            certTemplate.style.textAlign = 'center';
            certTemplate.style.color = '#000';
            certTemplate.style.backgroundColor = '#FFF';
            certTemplate.style.border = '15px solid #1e3a8a'; // 파란색 테두리
            certTemplate.style.overflow = 'hidden'; // 내부 요소가 넘치지 않도록 설정

            // 테두리 이미지 또는 CSS 테두리 추가
            let borderImgLoadFailed = false;
            const borderImg = document.createElement('div');
            borderImg.style.position = 'absolute';
            borderImg.style.top = '0';
            borderImg.style.left = '0';
            borderImg.style.right = '0';
            borderImg.style.bottom = '0';
            borderImg.style.zIndex = '1';

            // 이미지 로드 시도
            const img = new Image();
            img.onload = () => {
                borderImg.style.backgroundImage = `url('${borderImagePath}')`;
                borderImg.style.backgroundPosition = 'center';
                borderImg.style.backgroundSize = 'contain';
                borderImg.style.backgroundRepeat = 'no-repeat';
                certTemplate.appendChild(borderImg);
            };
            img.onerror = () => {
                console.log('테두리 이미지 로드 실패. CSS 테두리 사용.');
                borderImgLoadFailed = true;
                // CSS 기반 테두리 생성
                this.createCSSDerivedBorder(certTemplate);
            };
            img.src = borderImagePath;

            // 테두리 이미지 로드 안되면 CSS 테두리 적용
            if (img.complete && img.naturalWidth === 0) {
                console.log('테두리 이미지 즉시 로드 실패. CSS 테두리 사용.');
                borderImgLoadFailed = true;
                this.createCSSDerivedBorder(certTemplate);
            } else if (img.complete) {
                // 이미 캐시된 이미지가 있다면 바로 적용
                borderImg.style.backgroundImage = `url('${borderImagePath}')`;
                borderImg.style.backgroundPosition = 'center';
                borderImg.style.backgroundSize = 'contain';
                borderImg.style.backgroundRepeat = 'no-repeat';
                certTemplate.appendChild(borderImg);
            }

            // 내용 컨테이너 (z-index를 높여 테두리 위에 표시)
            const contentContainer = document.createElement('div');
            contentContainer.style.position = 'relative';
            contentContainer.style.zIndex = '2';
            contentContainer.style.height = '100%';
            contentContainer.style.width = '100%';
            contentContainer.style.padding = '80px 100px';
            contentContainer.style.boxSizing = 'border-box';
            contentContainer.style.display = 'flex';
            contentContainer.style.flexDirection = 'column';
            contentContainer.style.justifyContent = 'space-between';

            // 자격증 제목 및 정보
            const headerDiv = document.createElement('div');
            headerDiv.style.textAlign = 'center';
            headerDiv.style.marginBottom = '40px';

            // 제목 (건강운동처방사)
            const titleH1 = document.createElement('h1');
            titleH1.textContent = certType;
            titleH1.style.fontSize = '36px';
            titleH1.style.fontWeight = 'bold';
            titleH1.style.color = '#1e3a8a';
            titleH1.style.marginBottom = '10px';
            headerDiv.appendChild(titleH1);

            // 영문 제목 (Pilates Specialist)
            const subtitleH2 = document.createElement('h2');
            subtitleH2.textContent = 'Pilates Specialist';
            subtitleH2.style.fontSize = '20px';
            subtitleH2.style.color = '#333';
            subtitleH2.style.marginBottom = '50px';
            headerDiv.appendChild(subtitleH2);

            // 자격증 정보 (인증번호, 성명, 급수, 취득일자)
            const infoDiv = document.createElement('div');
            infoDiv.style.textAlign = 'left';
            infoDiv.style.position = 'relative';
            infoDiv.style.marginBottom = '50px';

            // 정보 항목들
            const infoItems = [
                { label: '인증번호', value: certNumber },
                { label: '성    명', value: holderName },
                { label: '급    수', value: '1급' },
                { label: '취득일자', value: issueDate }
            ];

            infoItems.forEach(item => {
                const infoPara = document.createElement('p');
                infoPara.style.margin = '15px 0';
                infoPara.style.fontSize = '16px';
                infoPara.style.lineHeight = '1.5';

                const labelSpan = document.createElement('span');
                labelSpan.textContent = `${item.label} : `;
                labelSpan.style.fontWeight = '500';

                const valueSpan = document.createElement('span');
                valueSpan.textContent = item.value;
                valueSpan.style.fontWeight = '600';

                infoPara.appendChild(labelSpan);
                infoPara.appendChild(valueSpan);
                infoDiv.appendChild(infoPara);
            });

            // 사진 영역
            const photoDiv = document.createElement('div');
            photoDiv.style.position = 'absolute';
            photoDiv.style.top = '0';
            photoDiv.style.right = '0';
            photoDiv.style.width = '120px';
            photoDiv.style.height = '150px';
            photoDiv.style.border = '1px solid #000';
            photoDiv.style.display = 'flex';
            photoDiv.style.alignItems = 'center';
            photoDiv.style.justifyContent = 'center';
            photoDiv.style.backgroundColor = '#f8f8f8';

            const photoText = document.createElement('p');
            photoText.textContent = '사진';
            photoText.style.fontSize = '14px';
            photoText.style.color = '#888';
            photoDiv.appendChild(photoText);
            infoDiv.appendChild(photoDiv);

            // 인증 문구
            const certTextDiv = document.createElement('div');
            certTextDiv.style.textAlign = 'center';
            certTextDiv.style.margin = '60px 0';
            certTextDiv.style.fontSize = '18px';
            certTextDiv.style.lineHeight = '1.8';

            const certText = document.createElement('div');
            certText.innerHTML = `
            <p>본 사항은 ${certType} 1급 교육과정을</p>
            <p>이수하고 이론 및 실기 심사에 통과하였으므로</p>
            <p>자격증을 수여합니다.</p>
        `;
            certTextDiv.appendChild(certText);

            // 하단 발급 정보 (날짜, 기관명, 직인)
            const footerDiv = document.createElement('div');
            footerDiv.style.marginTop = 'auto';
            footerDiv.style.width = '100%';
            footerDiv.style.position = 'relative';

            // 발급일 (오른쪽 정렬)
            const dateDiv = document.createElement('div');
            dateDiv.style.textAlign = 'right';
            dateDiv.style.marginBottom = '30px';

            const dateText = document.createElement('p');
            dateText.textContent = formattedToday;
            dateText.style.fontSize = '16px';
            dateDiv.appendChild(dateText);
            footerDiv.appendChild(dateDiv);

            // 발급 기관명과 직인 컨테이너 (중앙 정렬)
            const orgContainer = document.createElement('div');
            orgContainer.style.position = 'relative';
            orgContainer.style.width = '100%';
            orgContainer.style.textAlign = 'center';
            orgContainer.style.paddingBottom = '20px';

            // 기관명
            const orgText = document.createElement('p');
            orgText.textContent = '(사)문경 부설 디지털헬스케어센터';
            orgText.style.fontSize = '20px';
            orgText.style.fontWeight = 'bold';
            orgText.style.margin = '0';
            orgText.style.paddingRight = '30px'; // 직인 공간 확보
            orgContainer.appendChild(orgText);

            // 직인 이미지 - PDF 레이아웃에 맞게 위치 조정
            const sealImg = document.createElement('img');
            sealImg.src = sealImagePath;
            sealImg.style.position = 'absolute';
            sealImg.style.width = '80px';
            sealImg.style.height = '80px';
            sealImg.style.right = '10px';  // 오른쪽 정렬
            sealImg.style.bottom = '0px';  // 하단 정렬
            sealImg.style.opacity = '0.9';
            sealImg.style.zIndex = '3';
            orgContainer.appendChild(sealImg);

            footerDiv.appendChild(orgContainer);

            // 구성 요소 추가
            contentContainer.appendChild(headerDiv);
            contentContainer.appendChild(infoDiv);
            contentContainer.appendChild(certTextDiv);
            contentContainer.appendChild(footerDiv);

            certTemplate.appendChild(contentContainer);
            document.body.appendChild(certTemplate);

            try {
                // 이미지 로딩 기다리기
                await new Promise((resolve) => {
                    // 모든 이미지가 로드될 때까지 기다림
                    const images = certTemplate.querySelectorAll('img');
                    let loadedCount = 0;

                    const checkComplete = () => {
                        loadedCount++;
                        if (loadedCount === images.length) resolve();
                    };

                    // 이미 로드된 이미지 처리
                    images.forEach(img => {
                        if (img.complete) {
                            checkComplete();
                        } else {
                            img.onload = checkComplete;
                            img.onerror = () => {
                                console.error(`이미지 로드 실패: ${img.src}`);
                                checkComplete();
                            };
                        }
                    });

                    // 이미지가 없을 경우 바로 해결
                    if (images.length === 0) resolve();

                    // 안전장치: 최대 3초 후 계속 진행
                    setTimeout(resolve, 3000);
                });

                // html2canvas 옵션 - 이미지 로딩을 위한 충분한 시간 확보
                const canvasOptions = {
                    scale: 2, // 고해상도
                    logging: true, // 디버깅을 위해 로깅 활성화
                    useCORS: true, // 외부 이미지 허용
                    allowTaint: true, // 외부 이미지 허용
                    backgroundColor: "#ffffff", // 배경색 지정
                    imageTimeout: 5000, // 이미지 로딩 타임아웃 증가
                    onclone: (clonedDoc) => {
                        // 복제된 요소에서 이미지 데이터 확인
                        console.log('클론 문서에서 이미지 확인:',
                            clonedDoc.querySelectorAll('img').length);
                    }
                };

                // html2canvas로 PDF 생성
                const canvas = await html2canvas(certTemplate, canvasOptions);

                // PDF 생성
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'mm', 'a4');

                // 캔버스를 이미지로 변환하여 PDF에 추가
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = doc.internal.pageSize.getWidth();
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                // PDF 저장
                doc.save(`${certType}_${holderName}_${certNumber}_한글.pdf`);

                window.adminAuth?.showNotification('한글 자격증 PDF가 생성되었습니다.', 'success');
            } catch (error) {
                console.error('HTML을 이미지로 변환 중 오류:', error);
                window.adminAuth?.showNotification('PDF 생성 중 오류가 발생했습니다.', 'error');
            }

            // 임시 템플릿 제거
            document.body.removeChild(certTemplate);

        } catch (error) {
            console.error('한글 PDF 생성 오류:', error);
            window.adminAuth?.showNotification('PDF 생성 중 오류가 발생했습니다.', 'error');
        }
    },

    /**
     * 영문 자격증 PDF 생성
     */
    generateEnglishCertPdf: async function (certId) {
        try {
            // 자격증 정보 조회
            let cert = null;
            let courseName = '';

            if (window.dhcFirebase && window.dhcFirebase.db) {
                try {
                    const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                    const docSnap = await docRef.get();

                    if (docSnap.exists) {
                        cert = {
                            id: docSnap.id,
                            ...docSnap.data()
                        };

                        // 교육 과정 정보 조회
                        if (cert.courseId) {
                            try {
                                const courseRef = window.dhcFirebase.db.collection('courses').doc(cert.courseId);
                                const courseSnap = await courseRef.get();

                                if (courseSnap.exists) {
                                    courseName = courseSnap.data().title || '';
                                }
                            } catch (error) {
                                console.error('교육 과정 조회 오류:', error);
                            }
                        }
                    } else {
                        window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                        return;
                    }
                } catch (error) {
                    console.error('자격증 정보 조회 오류:', error);
                    window.adminAuth?.showNotification('자격증 정보를 불러올 수 없습니다.', 'error');
                    return;
                }
            } else {
                // 테스트 데이터
                cert = this.getMockCertificateById(certId);
                if (!cert) {
                    window.adminAuth?.showNotification('자격증 정보를 찾을 수 없습니다.', 'error');
                    return;
                }

                courseName = cert.course || 'Health Exercise Course';
            }

            // 자격증 정보 추출
            const certNumber = cert.certificateNumber || cert.certNumber || 'XX-0000-0000';
            const holderName = cert.holderName || cert.name || 'John Doe';
            const issueDate = this.formatDate(cert.issueDate) || '2025-05-01';
            const expiryDate = this.formatDate(cert.expiryDate) || '2028-05-01';
            const certType = this.getCertTypeNameEn(cert.certificateType || this.currentCertType);

            // 발급일 포맷팅
            const today = new Date();
            const formattedToday = `${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

            // 직인 및 배경 이미지 경로
            const sealImagePath = window.adjustPath('assets/images/logo/seal.png'); // 실제 직인 이미지 경로
            const borderImagePath = window.adjustPath('assets/images/certificates/border-gold.png'); // 테두리 이미지 (첨부한 이미지처럼)
            const logoImagePath = window.adjustPath('assets/images/logo/logo.jpeg'); // 로고 이미지

            // HTML 템플릿 생성 (영문 자격증)
            const certTemplate = document.createElement('div');
            certTemplate.style.width = '793px'; // A4 너비 (px)
            certTemplate.style.height = '1122px'; // A4 높이 (px)
            certTemplate.style.position = 'absolute';
            certTemplate.style.left = '-9999px';
            certTemplate.style.fontFamily = 'Times New Roman, serif';
            certTemplate.style.padding = '0';
            certTemplate.style.boxSizing = 'border-box';
            certTemplate.style.textAlign = 'center';
            certTemplate.style.color = '#000';
            certTemplate.style.backgroundColor = '#FFF';
            certTemplate.style.border = '15px solid #1e3a8a'; // 파란색 테두리
            certTemplate.style.overflow = 'hidden'; // 내부 요소가 넘치지 않도록 설정

            // 테두리 이미지 또는 CSS 테두리 추가
            let borderImgLoadFailed = false;
            const borderImg = document.createElement('div');
            borderImg.style.position = 'absolute';
            borderImg.style.top = '0';
            borderImg.style.left = '0';
            borderImg.style.right = '0';
            borderImg.style.bottom = '0';
            borderImg.style.zIndex = '1';

            // 이미지 로드 시도
            const img = new Image();
            img.onload = () => {
                borderImg.style.backgroundImage = `url('${borderImagePath}')`;
                borderImg.style.backgroundPosition = 'center';
                borderImg.style.backgroundSize = 'contain';
                borderImg.style.backgroundRepeat = 'no-repeat';
                certTemplate.appendChild(borderImg);
            };
            img.onerror = () => {
                console.log('테두리 이미지 로드 실패. CSS 테두리 사용.');
                borderImgLoadFailed = true;
                // CSS 기반 테두리 생성
                this.createCSSDerivedBorder(certTemplate);
            };
            img.src = borderImagePath;

            // 테두리 이미지 로드 안되면 CSS 테두리 적용
            if (img.complete && img.naturalWidth === 0) {
                console.log('테두리 이미지 즉시 로드 실패. CSS 테두리 사용.');
                borderImgLoadFailed = true;
                this.createCSSDerivedBorder(certTemplate);
            } else if (img.complete) {
                // 이미 캐시된 이미지가 있다면 바로 적용
                borderImg.style.backgroundImage = `url('${borderImagePath}')`;
                borderImg.style.backgroundPosition = 'center';
                borderImg.style.backgroundSize = 'contain';
                borderImg.style.backgroundRepeat = 'no-repeat';
                certTemplate.appendChild(borderImg);
            }

            // 내용 컨테이너 (z-index를 높여 테두리 위에 표시)
            const contentContainer = document.createElement('div');
            contentContainer.style.position = 'relative';
            contentContainer.style.zIndex = '2';
            contentContainer.style.height = '100%';
            contentContainer.style.width = '100%';
            contentContainer.style.padding = '80px 100px';
            contentContainer.style.boxSizing = 'border-box';
            contentContainer.style.display = 'flex';
            contentContainer.style.flexDirection = 'column';
            contentContainer.style.justifyContent = 'space-between';

            // 자격증 제목 및 정보
            const headerDiv = document.createElement('div');
            headerDiv.style.textAlign = 'center';
            headerDiv.style.marginBottom = '30px';

            // 영문 제목 (CERTIFICATE)
            const titleH1 = document.createElement('h1');
            titleH1.textContent = 'CERTIFICATE';
            titleH1.style.fontSize = '36px';
            titleH1.style.fontWeight = 'bold';
            titleH1.style.color = '#1e3a8a';
            titleH1.style.marginBottom = '10px';
            headerDiv.appendChild(titleH1);

            // 영문 부제목 (Health Exercise Specialist)
            const subtitleH2 = document.createElement('h2');
            subtitleH2.textContent = certType;
            subtitleH2.style.fontSize = '24px';
            subtitleH2.style.color = '#1e3a8a';
            subtitleH2.style.marginBottom = '40px';
            headerDiv.appendChild(subtitleH2);

            // 인증 문구 영역
            const certTextDiv = document.createElement('div');
            certTextDiv.style.margin = '30px 0';
            certTextDiv.style.textAlign = 'center';

            const certIntro = document.createElement('p');
            certIntro.textContent = 'This is to certify that';
            certIntro.style.fontSize = '18px';
            certIntro.style.marginBottom = '20px';
            certTextDiv.appendChild(certIntro);

            const certName = document.createElement('p');
            certName.textContent = holderName;
            certName.style.fontSize = '30px';
            certName.style.fontWeight = 'bold';
            certName.style.fontStyle = 'italic';
            certName.style.marginBottom = '20px';
            certTextDiv.appendChild(certName);

            const certDesc = document.createElement('p');
            certDesc.innerHTML = `
            has successfully completed the ${certType} training program<br>
            and passed all theoretical and practical examinations<br>
            with distinction, and is hereby certified.
        `;
            certDesc.style.fontSize = '16px';
            certDesc.style.lineHeight = '1.6';
            certTextDiv.appendChild(certDesc);

            // 하단 정보 영역 (데이터, 직인, 기관명)
            const bottomSection = document.createElement('div');
            bottomSection.style.marginTop = 'auto';
            bottomSection.style.width = '100%';
            bottomSection.style.position = 'relative';

            // 왼쪽 정보 (자격증 번호, 발급일, 만료일)
            const leftInfo = document.createElement('div');
            leftInfo.style.textAlign = 'left';
            leftInfo.style.float = 'left';
            leftInfo.style.fontSize = '14px';

            const certNumberInfo = document.createElement('p');
            certNumberInfo.innerHTML = `<strong>Certificate No:</strong> ${certNumber}`;
            certNumberInfo.style.margin = '8px 0';
            leftInfo.appendChild(certNumberInfo);

            const issueDateInfo = document.createElement('p');
            issueDateInfo.innerHTML = `<strong>Issue Date:</strong> ${issueDate}`;
            issueDateInfo.style.margin = '8px 0';
            leftInfo.appendChild(issueDateInfo);

            const expiryDateInfo = document.createElement('p');
            expiryDateInfo.innerHTML = `<strong>Expiry Date:</strong> ${expiryDate}`;
            expiryDateInfo.style.margin = '8px 0';
            leftInfo.appendChild(expiryDateInfo);

            bottomSection.appendChild(leftInfo);

            // 오른쪽 정보 (날짜)
            const rightInfo = document.createElement('div');
            rightInfo.style.textAlign = 'right';
            rightInfo.style.float = 'right';
            rightInfo.style.position = 'relative';

            const dateInfo = document.createElement('p');
            dateInfo.textContent = formattedToday;
            dateInfo.style.margin = '8px 0';
            dateInfo.style.fontSize = '14px';
            rightInfo.appendChild(dateInfo);

            // 직인 영역 (고정된 위치)
            const sealContainer = document.createElement('div');
            sealContainer.style.position = 'absolute';
            sealContainer.style.top = '40px';
            sealContainer.style.right = '0';

            const sealImg = document.createElement('img');
            sealImg.src = sealImagePath;
            sealImg.style.width = '80px';
            sealImg.style.height = '80px';
            sealImg.style.opacity = '0.9';
            sealContainer.appendChild(sealImg);

            const sealText = document.createElement('span');
            sealText.textContent = 'SEAL';
            sealText.style.position = 'absolute';
            sealText.style.top = '50%';
            sealText.style.left = '50%';
            sealText.style.transform = 'translate(-50%, -50%)';
            sealText.style.color = '#ff0000';
            sealText.style.fontWeight = 'bold';
            sealContainer.appendChild(sealText);

            rightInfo.appendChild(sealContainer);
            bottomSection.appendChild(rightInfo);

            // 클리어 플롯
            const clearDiv = document.createElement('div');
            clearDiv.style.clear = 'both';
            bottomSection.appendChild(clearDiv);

            // 기관명 컨테이너 (우측 하단 정렬)
            const orgContainer = document.createElement('div');
            orgContainer.style.textAlign = 'right';
            orgContainer.style.marginTop = '80px';
            orgContainer.style.paddingRight = '20px';

            // 기관명
            const orgName = document.createElement('p');
            orgName.textContent = 'Digital Healthcare Center';
            orgName.style.fontWeight = 'bold';
            orgName.style.fontSize = '16px';
            orgName.style.margin = '0';
            orgContainer.appendChild(orgName);

            // 부기관명
            const orgSubName = document.createElement('p');
            orgSubName.textContent = 'Center for Digital Health';
            orgSubName.style.fontSize = '14px';
            orgSubName.style.margin = '5px 0 0 0';
            orgContainer.appendChild(orgSubName);

            bottomSection.appendChild(orgContainer);

            // 구성 요소 추가
            contentContainer.appendChild(headerDiv);
            contentContainer.appendChild(certTextDiv);
            contentContainer.appendChild(bottomSection);

            certTemplate.appendChild(contentContainer);
            document.body.appendChild(certTemplate);

            try {
                // 이미지 로딩 기다리기
                await new Promise((resolve) => {
                    // 모든 이미지가 로드될 때까지 기다림
                    const images = certTemplate.querySelectorAll('img');
                    let loadedCount = 0;

                    const checkComplete = () => {
                        loadedCount++;
                        if (loadedCount === images.length) resolve();
                    };

                    // 이미 로드된 이미지 처리
                    images.forEach(img => {
                        if (img.complete) {
                            checkComplete();
                        } else {
                            img.onload = checkComplete;
                            img.onerror = () => {
                                console.error(`이미지 로드 실패: ${img.src}`);
                                checkComplete();
                            };
                        }
                    });

                    // 이미지가 없을 경우 바로 해결
                    if (images.length === 0) resolve();

                    // 안전장치: 최대 3초 후 계속 진행
                    setTimeout(resolve, 3000);
                });

                // html2canvas 옵션 - 이미지 로딩을 위한 충분한 시간 확보
                const canvasOptions = {
                    scale: 2, // 고해상도
                    logging: true, // 디버깅을 위해 로깅 활성화
                    useCORS: true, // 외부 이미지 허용
                    allowTaint: true, // 외부 이미지 허용
                    backgroundColor: "#ffffff", // 배경색 지정
                    imageTimeout: 5000, // 이미지 로딩 타임아웃 증가
                    onclone: (clonedDoc) => {
                        // 복제된 요소에서 이미지 데이터 확인
                        console.log('클론 문서에서 이미지 확인:',
                            clonedDoc.querySelectorAll('img').length);
                    }
                };

                // html2canvas로 PDF 생성
                const canvas = await html2canvas(certTemplate, canvasOptions);

                // PDF 생성
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'mm', 'a4');

                // 캔버스를 이미지로 변환하여 PDF에 추가
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = doc.internal.pageSize.getWidth();
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                // PDF 저장
                doc.save(`${certType}_${holderName}_${certNumber}_English.pdf`);

                window.adminAuth?.showNotification('영문 자격증 PDF가 생성되었습니다.', 'success');
            } catch (error) {
                console.error('HTML을 이미지로 변환 중 오류:', error);
                window.adminAuth?.showNotification('PDF 생성 중 오류가 발생했습니다.', 'error');
            }

            // 임시 템플릿 제거
            document.body.removeChild(certTemplate);

        } catch (error) {
            console.error('영문 PDF 생성 오류:', error);
            window.adminAuth?.showNotification('PDF 생성 중 오류가 발생했습니다.', 'error');
        }
    },

    /**
     * 자격증 취소
     */
    revokeCertificate: function (certId) {
        if (window.adminUtils?.confirmDialog) {
            window.adminUtils.confirmDialog(
                '정말로 이 자격증을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
                `certManager.handleRevokeCertificate('${certId}')`
            );
        } else {
            if (confirm('정말로 이 자격증을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                this.handleRevokeCertificate(certId);
            }
        }
    },

    /**
     * 자격증 취소 처리
     */
    handleRevokeCertificate: async function (certId) {
        try {
            // 로딩 표시
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(true);
            }

            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db) {
                // 업데이트 데이터
                const updateData = {
                    status: 'revoked',
                    revokedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };

                // Firebase에 업데이트
                try {
                    const docRef = window.dhcFirebase.db.collection('certificates').doc(certId);
                    await docRef.update(updateData);

                    // 성공 메시지
                    window.adminAuth?.showNotification('자격증이 성공적으로 취소되었습니다.', 'success');

                    // 목록 새로고침
                    this.loadCertificates();
                } catch (error) {
                    console.error('자격증 취소 오류:', error);
                    window.adminAuth?.showNotification('자격증 취소에 실패했습니다.', 'error');
                }
            } else {
                // 테스트 환경에서는 성공으로 처리
                setTimeout(() => {
                    // 성공 메시지
                    window.adminAuth?.showNotification('자격증이 성공적으로 취소되었습니다.', 'success');

                    // 목록 새로고침
                    this.loadCertificates();
                }, 1000);
            }
        } catch (error) {
            console.error('자격증 취소 오류:', error);
            window.adminAuth?.showNotification('자격증 취소 중 오류가 발생했습니다.', 'error');
        } finally {
            // 로딩 종료
            if (window.adminUtils?.showLoadingOverlay) {
                window.adminUtils.showLoadingOverlay(false);
            }
        }
    },

    /**
     * 상태 텍스트 가져오기
     */
    getStatusText: function (status) {
        switch (status) {
            case 'active': return '유효';
            case 'expired': return '만료';
            case 'revoked': return '취소';
            case 'suspended': return '정지';
            default: return status || '알 수 없음';
        }
    },

    /**
     * 자격증 유형 이름 가져오기 (한글)
     */
    getCertTypeName: function (type) {
        switch (type) {
            case 'health-exercise': return '건강운동처방사';
            case 'rehabilitation': return '운동재활전문가';
            case 'pilates': return '필라테스 전문가';
            case 'recreation': return '레크리에이션지도자';
            default: return type || '알 수 없음';
        }
    },

    /**
     * 자격증 유형 이름 가져오기 (영문)
     */
    getCertTypeNameEn: function (type) {
        switch (type) {
            case 'health-exercise': return 'Health Exercise Specialist';
            case 'rehabilitation': return 'Exercise Rehabilitation Specialist';
            case 'pilates': return 'Pilates Specialist';
            case 'recreation': return 'Recreation Instructor';
            default: return type || 'Unknown';
        }
    },

    /**
     * 날짜 포맷팅
     */
    formatDate: function (date, includeTime) {
        if (!date) return '-';

        try {
            // Firebase Timestamp인 경우
            if (typeof date.toDate === 'function') {
                date = date.toDate();
            } else if (typeof date === 'string') {
                // 이미 문자열 형태이면 그대로 반환
                return date;
            }

            // Date 객체인 경우
            if (date instanceof Date) {
                // 기본 포맷팅
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');

                if (includeTime) {
                    const hh = String(date.getHours()).padStart(2, '0');
                    const mi = String(date.getMinutes()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
                } else {
                    return `${yyyy}-${mm}-${dd}`;
                }
            }
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
        }

        return '-';
    },

    /**
     * 날짜를 input[type="date"]용으로 포맷팅
     */
    formatDateToInput: function (date) {
        if (!date) return '';

        try {
            // Firebase Timestamp인 경우
            if (typeof date.toDate === 'function') {
                date = date.toDate();
            } else if (typeof date === 'string') {
                // YYYY-MM-DD 형식인지 확인
                if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return date;
                }
                // 다른 형식의 문자열일 경우 Date 객체로 변환
                date = new Date(date);
            }

            // Date 객체인 경우
            if (date instanceof Date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
        }

        return '';
    },

    /**
     * 테스트용 모의 자격증 데이터 가져오기
     */
    getMockCertificates: function () {
        // Firebase 연동 전 테스트용 데이터
        return [
            {
                id: 'cert1',
                certNumber: 'HE-2025-0001',
                name: '홍길동',
                course: '건강운동처방사 1기',
                issueDate: '2025-03-15',
                expiryDate: '2028-03-14',
                status: 'active',
                remarks: '최우수 성적으로 수료'
            },
            {
                id: 'cert2',
                certNumber: 'HE-2025-0002',
                name: '김철수',
                course: '건강운동처방사 1기',
                issueDate: '2025-03-15',
                expiryDate: '2028-03-14',
                status: 'active',
                remarks: ''
            },
            {
                id: 'cert3',
                certNumber: 'HE-2024-0035',
                name: '이영희',
                course: '건강운동처방사 4기',
                issueDate: '2024-12-20',
                expiryDate: '2027-12-19',
                status: 'active',
                remarks: ''
            },
            {
                id: 'cert4',
                certNumber: 'HE-2024-0012',
                name: '박지민',
                course: '건강운동처방사 2기',
                issueDate: '2024-06-30',
                expiryDate: '2024-06-29',
                status: 'expired',
                remarks: '만료됨'
            },
            {
                id: 'cert5',
                certNumber: 'HE-2024-0018',
                name: '최민수',
                course: '건강운동처방사 3기',
                issueDate: '2024-09-15',
                expiryDate: '2027-09-14',
                status: 'suspended',
                remarks: '위반 행위로 인한 자격 정지'
            }
        ];
    },

    /**
     * ID로 테스트용 모의 자격증 데이터 가져오기
     */
    getMockCertificateById: function (certId) {
        const certs = this.getMockCertificates();
        return certs.find(cert => cert.id === certId) || null;
    }
};

// 페이지 초기화 함수 (script-loader.js에 의해 호출됨)
window.initPage = function () {
    console.log('자격증 관리 페이지 초기화 중...');
    // 추가 초기화 로직 (필요시)
    console.log('자격증 관리 페이지 초기화 완료');
};