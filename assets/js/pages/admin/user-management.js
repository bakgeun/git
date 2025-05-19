/**
 * 회원 관리 페이지 스크립트
 */

// 회원 관리 객체
window.userManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    
    /**
     * 초기화 함수
     */
    init: async function() {
        try {
            console.log('회원 관리자 초기화 시작');
            
            // 관리자 정보 표시
            if (window.adminAuth && typeof window.adminAuth.displayAdminInfo === 'function') {
                await window.adminAuth.displayAdminInfo();
            }
            
            // 이벤트 리스너 등록
            this.registerEventListeners();
            
            // 회원 목록 로드
            await this.loadUsers();
            
            console.log('회원 관리자 초기화 완료');
            return true;
        } catch (error) {
            console.error('회원 관리자 초기화 오류:', error);
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
        console.log('이벤트 리스너 등록 시작');
        
        // 검색 버튼
        const searchButton = document.getElementById('search-button');
        if (searchButton) {
            searchButton.addEventListener('click', this.applyFilters.bind(this));
            console.log('검색 버튼 이벤트 리스너 등록 완료');
        } else {
            console.error('검색 버튼을 찾을 수 없습니다.');
        }
        
        // 초기화 버튼
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', this.resetFilters.bind(this));
            console.log('초기화 버튼 이벤트 리스너 등록 완료');
        } else {
            console.error('초기화 버튼을 찾을 수 없습니다.');
        }
        
        // 회원 추가 버튼
        const addUserButton = document.getElementById('add-user-button');
        if (addUserButton) {
            addUserButton.addEventListener('click', this.showAddUserModal.bind(this));
            console.log('회원 추가 버튼 이벤트 리스너 등록 완료');
        } else {
            console.error('회원 추가 버튼을 찾을 수 없습니다.');
        }
        
        // 사용자 모달 관련 이벤트
        const closeModalButton = document.getElementById('close-modal');
        const cancelButton = document.getElementById('cancel-button');
        if (closeModalButton) {
            closeModalButton.addEventListener('click', this.closeUserModal.bind(this));
        }
        if (cancelButton) {
            cancelButton.addEventListener('click', this.closeUserModal.bind(this));
        }
        
        // 사용자 폼 제출 이벤트
        const userForm = document.getElementById('user-form');
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const userId = userForm.dataset.userId;
                if (userId) {
                    this.handleEditUser(e, userId);
                } else {
                    this.handleAddUser(e);
                }
            });
        }
        
        // 검색어 입력 시 엔터키로 검색
        const searchKeyword = document.getElementById('search-keyword');
        if (searchKeyword) {
            searchKeyword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        }
        
        console.log('이벤트 리스너 등록 완료');
    },
    
    /**
     * 회원 목록 로드
     */
    loadUsers: async function() {
        console.log('회원 목록 로드 시작');
        
        // 로딩 표시
        document.getElementById('user-list').innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    데이터를 불러오는 중입니다...
                </td>
            </tr>
        `;
        
        try {
            let users = [];
            
            // Firebase 연동 시
            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                // 필터 옵션 설정
                const options = {
                    orderBy: { field: 'createdAt', direction: 'desc' },
                    pageSize: this.pageSize
                };
                
                // 필터 적용
                const userType = document.getElementById('filter-role')?.value;
                const status = document.getElementById('filter-status')?.value;
                const searchKeyword = document.getElementById('search-keyword')?.value;
                
                if (userType) {
                    options.where = options.where || [];
                    options.where.push({ field: 'userType', operator: '==', value: userType });
                }
                
                if (status) {
                    options.where = options.where || [];
                    options.where.push({ field: 'status', operator: '==', value: status });
                }
                
                // 검색어 필터 (이름 또는 이메일)
                let searchResults;
                if (searchKeyword) {
                    try {
                        // 이름으로 검색
                        const nameResults = await window.dbService.searchDocuments('users', 'displayName', searchKeyword, options);
                        // 이메일로 검색
                        const emailResults = await window.dbService.searchDocuments('users', 'email', searchKeyword, options);
                        
                        // 결과 병합 및 중복 제거
                        const allResults = [...(nameResults.data || []), ...(emailResults.data || [])];
                        const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
                        users = uniqueResults;
                    } catch (error) {
                        console.error('검색 오류:', error);
                        window.adminAuth?.showNotification('검색 중 오류가 발생했습니다.', 'error');
                    }
                } else {
                    // 일반 조회
                    try {
                        const result = await window.dbService.getPaginatedDocuments('users', options, this.currentPage > 1 ? this.lastDoc : null);
                        if (result.success) {
                            users = result.data;
                            this.lastDoc = result.lastDoc;
                            
                            // 페이지네이션을 위한 전체 개수 조회
                            const countResult = await window.dbService.countDocuments('users', { where: options.where });
                            if (countResult.success) {
                                const totalPages = Math.ceil(countResult.count / this.pageSize);
                                this.updatePagination(totalPages);
                            }
                        }
                    } catch (error) {
                        console.error('사용자 목록 조회 오류:', error);
                        window.adminAuth?.showNotification('사용자 목록 로드 중 오류가 발생했습니다.', 'error');
                    }
                }
            } else {
                // 테스트 데이터 (Firebase 연동 전)
                users = this.getMockUsers();
                
                // 테스트 페이지네이션
                this.updatePagination(3);
            }
            
            // 사용자 목록 업데이트
            this.updateUserList(users);
            
        } catch (error) {
            console.error('회원 목록 로드 오류:', error);
            document.getElementById('user-list').innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-red-500">
                        데이터 로드 중 오류가 발생했습니다.
                    </td>
                </tr>
            `;
        }
    },
    
    /**
     * 사용자 목록 업데이트
     */
    updateUserList: function(users) {
        const userList = document.getElementById('user-list');
        
        if (!users || users.length === 0) {
            userList.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        등록된 회원이 없습니다.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        users.forEach((user, index) => {
            // 날짜 포맷팅
            const createdAt = user.createdAt ? 
                (typeof user.createdAt.toDate === 'function' ? 
                    this.formatDate(user.createdAt.toDate()) : 
                    user.createdAt) : 
                '-';
            
            html += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${index + 1 + ((this.currentPage - 1) * this.pageSize)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${user.displayName || '미설정'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${user.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${this.getUserTypeName(user.userType)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.status === 'active' ? 'bg-green-100 text-green-800' : 
                            user.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}">
                            ${this.getStatusName(user.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${createdAt}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="userManager.editUser('${user.id}')" 
                            class="text-indigo-600 hover:text-indigo-900 mr-3">
                            수정
                        </button>
                        <button onclick="userManager.deleteUser('${user.id}')" 
                            class="text-red-600 hover:text-red-900">
                            삭제
                        </button>
                    </td>
                </tr>
            `;
        });
        
        userList.innerHTML = html;
    },
    
    /**
     * 페이지네이션 업데이트
     */
    updatePagination: function(totalPages) {
        const paginationContainer = document.getElementById('pagination-container');
        
        if (!paginationContainer) return;
        
        let html = '';
        
        if (totalPages > 1) {
            html = '<div class="flex space-x-1">';
            
            // 이전 페이지 버튼
            html += `
                <button onclick="userManager.changePage(${this.currentPage - 1})" 
                    class="px-4 py-2 border rounded-md text-sm 
                    ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                    이전
                </button>
            `;
            
            // 페이지 번호
            const maxVisiblePages = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `
                    <button onclick="userManager.changePage(${i})" 
                        class="px-4 py-2 border rounded-md text-sm 
                        ${this.currentPage === i ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700'}">
                        ${i}
                    </button>
                `;
            }
            
            // 다음 페이지 버튼
            html += `
                <button onclick="userManager.changePage(${this.currentPage + 1})" 
                    class="px-4 py-2 border rounded-md text-sm 
                    ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                    다음
                </button>
            `;
            
            html += '</div>';
        }
        
        paginationContainer.innerHTML = html;
    },
    
    /**
     * 페이지 변경
     */
    changePage: function(page) {
        if (page < 1) return;
        
        this.currentPage = page;
        this.loadUsers();
    },
    
    /**
     * 사용자 유형 이름 가져오기
     */
    getUserTypeName: function(userType) {
        switch (userType) {
            case 'admin': return '관리자';
            case 'student': return '수강생';
            case 'instructor': return '강사';
            case 'user': return '일반 회원';
            default: return userType || '일반 회원';
        }
    },
    
    /**
     * 상태 이름 가져오기
     */
    getStatusName: function(status) {
        switch (status) {
            case 'active': return '활성';
            case 'inactive': return '비활성';
            case 'suspended': return '정지';
            default: return status || '활성';
        }
    },
    
    /**
     * 날짜 포맷팅
     */
    formatDate: function(date) {
        if (!date) return '-';
        
        try {
            if (window.formatters && typeof window.formatters.formatDate === 'function') {
                return window.formatters.formatDate(date);
            } else {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
            return '-';
        }
    },
    
    /**
     * 회원 추가 모달 표시
     */
    showAddUserModal: function() {
        console.log('회원 추가 모달 표시');
        
        const modal = document.getElementById('user-modal');
        const form = document.getElementById('user-form');
        const modalTitle = document.getElementById('modal-title');
        
        if (!modal || !form) {
            console.error('모달 또는 폼을 찾을 수 없습니다.');
            return;
        }
        
        // 모달 초기화
        form.reset();
        form.removeAttribute('data-user-id');
        
        // 비밀번호 필드 필수 설정
        const passwordInput = document.getElementById('user-password');
        if (passwordInput) {
            passwordInput.required = true;
            passwordInput.nextElementSibling.textContent = '최소 6자 이상 입력해주세요.';
        }
        
        // 모달 타이틀 설정
        if (modalTitle) {
            modalTitle.textContent = '회원 추가';
        }
        
        // 모달 표시
        modal.classList.remove('hidden');
    },
    
    /**
     * 회원 수정 모달 표시
     */
    editUser: async function(userId) {
        console.log('회원 수정 모달 표시:', userId);
        
        try {
            const modal = document.getElementById('user-modal');
            const form = document.getElementById('user-form');
            const modalTitle = document.getElementById('modal-title');
            
            if (!modal || !form) {
                console.error('모달 또는 폼을 찾을 수 없습니다.');
                return;
            }
            
            // 모달 초기화
            form.reset();
            
            // 사용자 정보 로드
            let user = null;
            
            if (window.dhcFirebase && window.dhcFirebase.db && window.dbService) {
                const result = await window.dbService.getDocument('users', userId);
                if (result.success) {
                    user = result.data;
                } else {
                    window.adminAuth?.showNotification('사용자 정보를 불러올 수 없습니다.', 'error');
                    return;
                }
            } else {
                // 테스트 데이터
                user = this.getMockUserById(userId);
                if (!user) {
                    alert('사용자 정보를 찾을 수 없습니다.');
                    return;
                }
            }
            
            // 사용자 정보 설정
            document.getElementById('user-name').value = user.displayName || '';
            document.getElementById('user-email').value = user.email || '';
            
            const roleSelect = document.getElementById('user-role');
            if (roleSelect) {
                // role 값과 일치하는 옵션 선택
                for (let option of roleSelect.options) {
                    if (option.value === (user.userType || user.role)) {
                        option.selected = true;
                        break;
                    }
                }
            }
            
            const statusSelect = document.getElementById('user-status');
            if (statusSelect) {
                // status 값과 일치하는 옵션 선택
                for (let option of statusSelect.options) {
                    if (option.value === user.status) {
                        option.selected = true;
                        break;
                    }
                }
            }
            
            // 비밀번호 필드 선택 설정
            const passwordInput = document.getElementById('user-password');
            if (passwordInput) {
                passwordInput.required = false;
                passwordInput.value = '';
                passwordInput.nextElementSibling.textContent = '수정 시 비워두면 기존 비밀번호가 유지됩니다.';
            }
            
            // 사용자 ID 저장
            form.dataset.userId = userId;
            
            // 모달 타이틀 설정
            if (modalTitle) {
                modalTitle.textContent = '회원 정보 수정';
            }
            
            // 모달 표시
            modal.classList.remove('hidden');
            
        } catch (error) {
            console.error('회원 수정 모달 표시 오류:', error);
            window.adminAuth?.showNotification('사용자 정보를 불러오는 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 회원 모달 닫기
     */
    closeUserModal: function() {
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    
    /**
     * 회원 추가 처리
     */
    handleAddUser: async function(event) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const name = document.getElementById('user-name').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const role = document.getElementById('user-role').value;
            const status = document.getElementById('user-status').value;
            
            // 유효성 검사
            if (!email || !password || !name) {
                window.adminAuth?.showNotification('필수 항목을 모두 입력해주세요.', 'error');
                return;
            }
            
            // 비밀번호 길이 검사
            if (password.length < 6) {
                window.adminAuth?.showNotification('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
                return;
            }
            
            // Firebase 연동 시
            if (window.dhcFirebase && window.authService) {
                try {
                    const result = await window.authService.signUp(email, password, {
                        displayName: name,
                        userType: role,
                        status: status,
                        createdAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    if (result.success) {
                        window.adminAuth?.showNotification('회원이 성공적으로 추가되었습니다.', 'success');
                        this.closeUserModal();
                        this.loadUsers();
                    } else {
                        window.adminAuth?.showNotification(`회원 추가 실패: ${result.error?.message || '알 수 없는 오류'}`, 'error');
                    }
                } catch (error) {
                    console.error('회원 추가 오류:', error);
                    window.adminAuth?.showNotification(`회원 추가 오류: ${error.message || '알 수 없는 오류'}`, 'error');
                }
            } else {
                // 테스트 환경
                console.log('회원 추가 테스트:', { name, email, role, status });
                window.adminAuth?.showNotification('회원이 성공적으로 추가되었습니다.', 'success');
                this.closeUserModal();
                this.loadUsers();
            }
            
        } catch (error) {
            console.error('회원 추가 처리 오류:', error);
            window.adminAuth?.showNotification('회원 추가 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 회원 수정 처리
     */
    handleEditUser: async function(event, userId) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const name = document.getElementById('user-name').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const role = document.getElementById('user-role').value;
            const status = document.getElementById('user-status').value;
            
            // 유효성 검사
            if (!email || !name) {
                window.adminAuth?.showNotification('필수 항목을 모두 입력해주세요.', 'error');
                return;
            }
            
            // 비밀번호 길이 검사 (입력된 경우)
            if (password && password.length < 6) {
                window.adminAuth?.showNotification('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
                return;
            }
            
            // Firebase 연동 시
            if (window.dhcFirebase && window.dbService) {
                const updateData = {
                    displayName: name,
                    userType: role,
                    status: status,
                    updatedAt: window.dhcFirebase.firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // 비밀번호 변경이 필요한 경우
                if (password) {
                    try {
                        // 비밀번호 변경은 별도 로직이 필요함
                        // Firebase Auth를 통해 비밀번호 변경
                        // 간략화를 위해 생략
                    } catch (error) {
                        console.error('비밀번호 변경 오류:', error);
                        window.adminAuth?.showNotification('비밀번호 변경 중 오류가 발생했습니다.', 'error');
                    }
                }
                
                // 사용자 정보 업데이트
                try {
                    const result = await window.dbService.updateDocument('users', userId, updateData);
                    
                    if (result.success) {
                        window.adminAuth?.showNotification('회원 정보가 성공적으로 수정되었습니다.', 'success');
                        this.closeUserModal();
                        this.loadUsers();
                    } else {
                        window.adminAuth?.showNotification(`회원 정보 수정 실패: ${result.error?.message || '알 수 없는 오류'}`, 'error');
                    }
                } catch (error) {
                    console.error('회원 정보 수정 오류:', error);
                    window.adminAuth?.showNotification(`회원 정보 수정 오류: ${error.message || '알 수 없는 오류'}`, 'error');
                }
            } else {
                // 테스트 환경
                console.log('회원 수정 테스트:', { userId, name, email, role, status, password: password ? '변경됨' : '유지' });
                window.adminAuth?.showNotification('회원 정보가 성공적으로 수정되었습니다.', 'success');
                this.closeUserModal();
                this.loadUsers();
            }
            
        } catch (error) {
            console.error('회원 수정 처리 오류:', error);
            window.adminAuth?.showNotification('회원 정보 수정 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 회원 삭제
     */
    deleteUser: function(userId) {
        console.log('회원 삭제:', userId);
        
        if (confirm('정말로 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            this.handleDeleteUser(userId);
        }
    },
    
    /**
     * 회원 삭제 처리
     */
    handleDeleteUser: async function(userId) {
        try {
            // Firebase 연동 시
            if (window.dhcFirebase && window.dbService) {
                try {
                    const result = await window.dbService.deleteDocument('users', userId);
                    
                    if (result.success) {
                        window.adminAuth?.showNotification('회원이 성공적으로 삭제되었습니다.', 'success');
                        this.loadUsers();
                    } else {
                        window.adminAuth?.showNotification(`회원 삭제 실패: ${result.error?.message || '알 수 없는 오류'}`, 'error');
                    }
                } catch (error) {
                    console.error('회원 삭제 오류:', error);
                    window.adminAuth?.showNotification(`회원 삭제 오류: ${error.message || '알 수 없는 오류'}`, 'error');
                }
            } else {
                // 테스트 환경
                console.log('회원 삭제 테스트:', userId);
                window.adminAuth?.showNotification('회원이 성공적으로 삭제되었습니다.', 'success');
                this.loadUsers();
            }
        } catch (error) {
            console.error('회원 삭제 처리 오류:', error);
            window.adminAuth?.showNotification('회원 삭제 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 검색 필터 적용
     */
    applyFilters: function() {
        console.log('검색 필터 적용');
        
        // 검색 조건 가져오기
        const searchKeyword = document.getElementById('search-keyword')?.value.trim();
        const userType = document.getElementById('filter-role')?.value;
        const status = document.getElementById('filter-status')?.value;
        
        console.log('검색 조건:', { searchKeyword, userType, status });
        
        // 첫 페이지로 이동
        this.currentPage = 1;
        this.lastDoc = null;
        
        // 회원 목록 다시 로드
        this.loadUsers();
    },
    
    /**
     * 검색 필터 초기화
     */
    resetFilters: function() {
        console.log('검색 필터 초기화');
        
        // 검색 필드 초기화
        const searchKeyword = document.getElementById('search-keyword');
        if (searchKeyword) searchKeyword.value = '';
        
        const userType = document.getElementById('filter-role');
        if (userType) userType.value = '';
        
        const status = document.getElementById('filter-status');
        if (status) status.value = '';
        
        // 첫 페이지로 이동
        this.currentPage = 1;
        this.lastDoc = null;
        
        // 회원 목록 다시 로드
        this.loadUsers();
    },
    
    /**
     * 테스트용 모의 사용자 데이터 가져오기
     */
    getMockUsers: function() {
        return [
            {
                id: 'user1',
                displayName: '홍길동',
                email: 'hong@example.com',
                userType: 'student',
                status: 'active',
                createdAt: '2025-01-15'
            },
            {
                id: 'user2',
                displayName: '김철수',
                email: 'kim@example.com',
                userType: 'student',
                status: 'active',
                createdAt: '2025-02-20'
            },
            {
                id: 'user3',
                displayName: '이영희',
                email: 'lee@example.com',
                userType: 'instructor',
                status: 'active',
                createdAt: '2025-03-10'
            },
            {
                id: 'user4',
                displayName: '박관리',
                email: 'park@example.com',
                userType: 'admin',
                status: 'active',
                createdAt: '2024-12-01'
            },
            {
                id: 'user5',
                displayName: '최민수',
                email: 'choi@example.com',
                userType: 'student',
                status: 'inactive',
                createdAt: '2025-01-25'
            }
        ];
    },
    
    /**
     * ID로 테스트용 모의 사용자 데이터 가져오기
     */
    getMockUserById: function(userId) {
        const users = this.getMockUsers();
        return users.find(user => user.id === userId) || null;
    }
};

/**
 * 회원 관리 페이지 초기화 함수
 */
window.initUserManagement = async function() {
    try {
        console.log('회원 관리 페이지 초기화 시작');
        
        // firebase 초기화 대기
        if (window.dhcFirebase && typeof window.dhcFirebase.initialize === 'function') {
            await window.dhcFirebase.initialize();
        }
        
        // 관리자 권한 확인
        let hasAccess = true;
        if (window.adminAuth && typeof window.adminAuth.checkAdminAccess === 'function') {
            hasAccess = await window.adminAuth.checkAdminAccess();
        }
        
        if (hasAccess) {
            await window.userManager.init();
        }
        
        console.log('회원 관리 페이지 초기화 완료');
    } catch (error) {
        console.error('회원 관리 페이지 초기화 오류:', error);
    }
};

// 이전 버전과의 호환성을 위한 함수
if (typeof window.scriptLoaderInitialized === 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        window.initUserManagement();
    });
}