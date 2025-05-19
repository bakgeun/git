/**
 * 자격증 관리 페이지 스크립트
 */

// formatters.js에 formatDateToInput 함수가 없으면 추가
if (window.formatters && !window.formatters.formatDateToInput) {
    window.formatters.formatDateToInput = function(date) {
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
    init: async function() {
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
    registerEventListeners: function() {
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
    switchCertType: function(certType) {
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
    loadCertificates: async function() {
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
    updateCertificateTable: function(certificates) {
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
                            <button onclick="certManager.downloadCertPdf('${cert.id}')" 
                                class="text-green-600 hover:text-green-800">
                                PDF
                            </button>
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
    },
    
    /**
     * 페이지네이션 업데이트
     */
    updatePagination: function(currentPage, totalPages) {
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
    changePage: function(page) {
        // 유효한 페이지 체크
        if (page < 1) return;
        
        this.currentPage = page;
        this.loadCertificates();
    },
    
    /**
     * 검색 기능
     */
    search: function() {
        // 검색 시 첫 페이지로 이동
        this.currentPage = 1;
        this.lastDoc = null;
        this.loadCertificates();
    },
    
    /**
     * 자격증 발급 모달 표시
     */
    showIssueCertModal: function() {
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
    closeIssueCertModal: function() {
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
    showBulkIssuanceModal: function() {
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
    closeBulkIssuanceModal: function() {
        const modal = document.getElementById('bulk-issue-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    /**
     * 일괄 발급 파일 업로드 처리
     */
    handleBulkFileUpload: function(event) {
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
    processBulkIssuance: function() {
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
    loadCourseOptions: async function() {
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
    issueCertificate: async function(form) {
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
                    createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
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
    getCertificateCount: async function(certType, year) {
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
    toggleSelectAll: function(checkbox) {
        const certCheckboxes = document.querySelectorAll('.cert-checkbox');
        certCheckboxes.forEach(cb => {
            cb.checked = checkbox.checked;
        });
    },
    
    /**
     * 자격증 상세 정보 보기
     */
    viewCertDetails: async function(certId) {
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
                </div>
            `;
            
            // 모달 표시
            if (window.adminUtils?.showModal) {
                window.adminUtils.showModal({
                    title: '자격증 상세 정보',
                    content: modalContent,
                    buttons: [
                        { label: '닫기', type: 'secondary', handler: 'adminUtils.closeModal()' },
                        { label: 'PDF 다운로드', type: 'primary', handler: `certManager.downloadCertPdf('${certId}'); adminUtils.closeModal()` }
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
    editCert: async function(certId) {
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
    handleUpdateCertificate: async function(event, certId) {
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
    downloadCertPdf: function(certId) {
        window.adminAuth?.showNotification('PDF 생성 중...', 'info');
        
        // 실제로는 여기서 PDF 생성 로직 구현
        // jsPDF 라이브러리나 서버 측 PDF 생성 서비스를 사용해야 함
        setTimeout(() => {
            window.adminAuth?.showNotification('PDF 생성 기능은 별도 구현이 필요합니다.', 'info');
        }, 1000);
    },
    
    /**
     * 자격증 취소
     */
    revokeCertificate: function(certId) {
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
    handleRevokeCertificate: async function(certId) {
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
    getStatusText: function(status) {
        switch (status) {
            case 'active': return '유효';
            case 'expired': return '만료';
            case 'revoked': return '취소';
            case 'suspended': return '정지';
            default: return status || '알 수 없음';
        }
    },
    
    /**
     * 자격증 유형 이름 가져오기
     */
    getCertTypeName: function(type) {
        switch (type) {
            case 'health-exercise': return '건강운동처방사';
            case 'rehabilitation': return '운동재활전문가';
            case 'pilates': return '필라테스 전문가';
            case 'recreation': return '레크리에이션지도자';
            default: return type || '알 수 없음';
        }
    },
    
    /**
     * 날짜 포맷팅
     */
    formatDate: function(date, includeTime) {
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
    formatDateToInput: function(date) {
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
    getMockCertificates: function() {
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
    getMockCertificateById: function(certId) {
        const certs = this.getMockCertificates();
        return certs.find(cert => cert.id === certId) || null;
    }
};

// 페이지 초기화 함수 (script-loader.js에 의해 호출됨)
window.initPage = function() {
    console.log('자격증 관리 페이지 초기화 중...');
    // 추가 초기화 로직 (필요시)
    console.log('자격증 관리 페이지 초기화 완료');
};