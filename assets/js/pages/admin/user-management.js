/**
 * 회원 관리 페이지 스크립트 (운영용 최종본)
 * - 회원 추가 기능 제거
 * - 권한 변경 기능 (수강생 ↔ 강사)
 * - 상태 관리 기능 (활성/비활성/정지)
 * - 완전 삭제 구현
 * - 관리자 계정 보호
 */

// 회원 관리 객체
window.userManager = {
    currentPage: 1,
    pageSize: 10,
    lastDoc: null,
    filters: {},
    pendingRoleChange: null,
    pendingStatusChange: null,
    currentUsers: [], // 현재 로드된 사용자 목록 캐시
    
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
            
            // 통계 정보 업데이트
            await this.updateUserStats();
            
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
        }
        
        // 초기화 버튼
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', this.resetFilters.bind(this));
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
            userForm.addEventListener('submit', this.handleEditUser.bind(this));
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
     * Firebase 사용 가능 여부 확인
     */
    isFirebaseAvailable: function() {
        try {
            return window.dhcFirebase && 
                   window.dhcFirebase.db && 
                   window.dbService && 
                   window.dhcFirebase.auth &&
                   window.dhcFirebase.auth.currentUser;
        } catch (error) {
            console.log('Firebase 가용성 확인 오류:', error);
            return false;
        }
    },
    
    /**
     * 회원 통계 업데이트
     */
    updateUserStats: async function() {
        try {
            let totalUsers = 0;
            let activeUsers = 0;
            let instructorUsers = 0;
            let suspendedUsers = 0;
            
            if (this.isFirebaseAvailable()) {
                try {
                    // 전체 회원 수
                    const totalResult = await window.dbService.countDocuments('users');
                    if (totalResult.success) {
                        totalUsers = totalResult.count;
                    }
                    
                    // 활성 회원 수
                    const activeResult = await window.dbService.countDocuments('users', {
                        where: { field: 'status', operator: '==', value: 'active' }
                    });
                    if (activeResult.success) {
                        activeUsers = activeResult.count;
                    }
                    
                    // 강사 수
                    const instructorResult = await window.dbService.countDocuments('users', {
                        where: { field: 'userType', operator: '==', value: 'instructor' }
                    });
                    if (instructorResult.success) {
                        instructorUsers = instructorResult.count;
                    }
                    
                    // 정지 회원 수
                    const suspendedResult = await window.dbService.countDocuments('users', {
                        where: { field: 'status', operator: '==', value: 'suspended' }
                    });
                    if (suspendedResult.success) {
                        suspendedUsers = suspendedResult.count;
                    }
                } catch (error) {
                    console.error('Firebase 통계 조회 오류:', error);
                    window.adminAuth?.showNotification('통계 조회 중 오류가 발생했습니다.', 'error');
                }
            }
            
            // UI 업데이트
            this.updateStatElement('total-users-count', totalUsers);
            this.updateStatElement('active-users-count', activeUsers);
            this.updateStatElement('instructor-users-count', instructorUsers);
            this.updateStatElement('suspended-users-count', suspendedUsers);
            
            console.log('통계 업데이트 완료:', { totalUsers, activeUsers, instructorUsers, suspendedUsers });
            
        } catch (error) {
            console.error('회원 통계 업데이트 오류:', error);
        }
    },
    
    /**
     * 통계 요소 업데이트
     */
    updateStatElement: function(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value.toLocaleString();
        }
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
            
            if (this.isFirebaseAvailable()) {
                // Firebase에서 사용자 목록 로드
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
                
                // 검색어 필터
                if (searchKeyword) {
                    try {
                        const nameResults = await window.dbService.searchDocuments('users', 'displayName', searchKeyword, options);
                        const emailResults = await window.dbService.searchDocuments('users', 'email', searchKeyword, options);
                        
                        const allResults = [...(nameResults.data || []), ...(emailResults.data || [])];
                        const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
                        users = uniqueResults;
                    } catch (error) {
                        console.error('검색 오류:', error);
                        window.adminAuth?.showNotification('검색 중 오류가 발생했습니다.', 'error');
                    }
                } else {
                    try {
                        const result = await window.dbService.getPaginatedDocuments('users', options, this.currentPage > 1 ? this.lastDoc : null);
                        if (result.success) {
                            users = result.data;
                            this.lastDoc = result.lastDoc;
                            
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
                // Firebase를 사용할 수 없는 경우
                console.log('Firebase를 사용할 수 없습니다.');
                document.getElementById('user-list').innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                            데이터베이스에 연결할 수 없습니다.
                        </td>
                    </tr>
                `;
                return;
            }
            
            // 현재 사용자 목록 캐시
            this.currentUsers = users;
            console.log('로드된 사용자 수:', this.currentUsers.length);
            
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
            const createdAt = user.createdAt ? 
                (typeof user.createdAt.toDate === 'function' ? 
                    this.formatDate(user.createdAt.toDate()) : 
                    user.createdAt) : 
                '-';
            
            const isAdmin = user.userType === 'admin';
            const canEdit = !isAdmin; // 관리자는 수정 불가
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${index + 1 + ((this.currentPage - 1) * this.pageSize)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="text-sm font-medium text-gray-900">${user.displayName || '미설정'}</div>
                            ${isAdmin ? '<span class="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">관리자</span>' : ''}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${user.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <span class="text-sm text-gray-900">${this.getUserTypeName(user.userType)}</span>
                            ${canEdit ? `
                                <button onclick="userManager.quickRoleChange('${user.id}', '${user.userType}')" 
                                    class="ml-2 text-xs text-indigo-600 hover:text-indigo-900 underline">
                                    변경
                                </button>
                            ` : ''}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${this.getStatusBadgeClass(user.status)}">
                                ${this.getStatusName(user.status)}
                            </span>
                            ${canEdit ? `
                                <button onclick="userManager.quickStatusChange('${user.id}', '${user.status}')" 
                                    class="ml-2 text-xs text-indigo-600 hover:text-indigo-900 underline">
                                    변경
                                </button>
                            ` : ''}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${createdAt}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${canEdit ? `
                            <button onclick="userManager.editUser('${user.id}')" 
                                class="text-indigo-600 hover:text-indigo-900 mr-3">
                                수정
                            </button>
                            <button onclick="userManager.deleteUser('${user.id}')" 
                                class="text-red-600 hover:text-red-900">
                                삭제
                            </button>
                        ` : `
                            <span class="text-gray-400">편집 불가</span>
                        `}
                    </td>
                </tr>
            `;
        });
        
        userList.innerHTML = html;
    },
    
    /**
     * 상태별 배지 클래스 반환
     */
    getStatusBadgeClass: function(status) {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    },
    
    /**
     * 빠른 권한 변경
     */
    quickRoleChange: async function(userId, currentRole) {
        console.log('빠른 권한 변경 시도:', userId, currentRole);
        
        const user = await this.getUserById(userId);
        if (!user) {
            console.error('사용자를 찾을 수 없음:', userId);
            window.adminAuth?.showNotification('사용자 정보를 찾을 수 없습니다.', 'error');
            return;
        }
        
        const nextRole = currentRole === 'student' ? 'instructor' : 'student';
        
        this.pendingRoleChange = {
            userId: userId,
            newRole: nextRole,
            userName: user.displayName || user.email
        };
        
        const message = `"${user.displayName || user.email}" 사용자의 권한을 "${this.getUserTypeName(nextRole)}"으로 변경하시겠습니까?`;
        document.getElementById('role-change-message').textContent = message;
        document.getElementById('role-change-modal').classList.remove('hidden');
    },
    
    /**
     * 빠른 상태 변경
     */
    quickStatusChange: async function(userId, currentStatus) {
        console.log('빠른 상태 변경 시도:', userId, currentStatus);
        
        const user = await this.getUserById(userId);
        if (!user) {
            console.error('사용자를 찾을 수 없음:', userId);
            window.adminAuth?.showNotification('사용자 정보를 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 상태 순환: active -> inactive -> suspended -> active
        let nextStatus;
        switch (currentStatus) {
            case 'active': nextStatus = 'inactive'; break;
            case 'inactive': nextStatus = 'suspended'; break;
            case 'suspended': nextStatus = 'active'; break;
            default: nextStatus = 'active';
        }
        
        this.pendingStatusChange = {
            userId: userId,
            newStatus: nextStatus,
            userName: user.displayName || user.email
        };
        
        const message = `"${user.displayName || user.email}" 사용자의 상태를 "${this.getStatusName(nextStatus)}"으로 변경하시겠습니까?`;
        document.getElementById('status-change-message').textContent = message;
        document.getElementById('status-change-modal').classList.remove('hidden');
    },
    
    /**
     * 사용자 ID로 사용자 정보 가져오기
     */
    getUserById: async function(userId) {
        console.log('사용자 조회 시도:', userId);
        
        // 1. 현재 캐시된 사용자 목록에서 먼저 검색
        if (this.currentUsers && this.currentUsers.length > 0) {
            const cachedUser = this.currentUsers.find(u => u.id === userId);
            if (cachedUser) {
                console.log('캐시된 사용자 목록에서 찾음:', cachedUser);
                return cachedUser;
            }
        }
        
        // 2. Firebase에서 검색
        if (this.isFirebaseAvailable()) {
            try {
                console.log('Firebase에서 검색 시도:', userId);
                const result = await window.dbService.getDocument('users', userId);
                if (result.success) {
                    console.log('Firebase에서 사용자 찾음:', result.data);
                    return result.data;
                } else {
                    console.log('Firebase에서 사용자 조회 실패:', result.error);
                }
            } catch (error) {
                console.error('Firebase 사용자 조회 오류:', error);
            }
        }
        
        console.error('사용자를 찾을 수 없음:', userId);
        return null;
    },
    
    /**
     * 권한 변경 확인
     */
    confirmRoleChange: async function() {
        if (!this.pendingRoleChange) return;
        
        try {
            const { userId, newRole } = this.pendingRoleChange;
            console.log('권한 변경 확인:', userId, newRole);
            
            if (this.isFirebaseAvailable()) {
                const result = await window.dbService.updateDocument('users', userId, {
                    userType: newRole
                });
                
                if (result.success) {
                    window.adminAuth?.showNotification('권한이 성공적으로 변경되었습니다.', 'success');
                    this.loadUsers();
                    this.updateUserStats();
                } else {
                    window.adminAuth?.showNotification('권한 변경에 실패했습니다.', 'error');
                }
            } else {
                window.adminAuth?.showNotification('데이터베이스에 연결할 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('권한 변경 오류:', error);
            window.adminAuth?.showNotification('권한 변경 중 오류가 발생했습니다.', 'error');
        }
        
        this.closeRoleChangeModal();
    },
    
    /**
     * 상태 변경 확인
     */
    confirmStatusChange: async function() {
        if (!this.pendingStatusChange) return;
        
        try {
            const { userId, newStatus } = this.pendingStatusChange;
            console.log('상태 변경 확인:', userId, newStatus);
            
            if (this.isFirebaseAvailable()) {
                const result = await window.dbService.updateDocument('users', userId, {
                    status: newStatus
                });
                
                if (result.success) {
                    window.adminAuth?.showNotification('상태가 성공적으로 변경되었습니다.', 'success');
                    this.loadUsers();
                    this.updateUserStats();
                } else {
                    window.adminAuth?.showNotification('상태 변경에 실패했습니다.', 'error');
                }
            } else {
                window.adminAuth?.showNotification('데이터베이스에 연결할 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('상태 변경 오류:', error);
            window.adminAuth?.showNotification('상태 변경 중 오류가 발생했습니다.', 'error');
        }
        
        this.closeStatusChangeModal();
    },
    
    /**
     * 권한 변경 모달 닫기
     */
    closeRoleChangeModal: function() {
        document.getElementById('role-change-modal').classList.add('hidden');
        this.pendingRoleChange = null;
    },
    
    /**
     * 상태 변경 모달 닫기
     */
    closeStatusChangeModal: function() {
        document.getElementById('status-change-modal').classList.add('hidden');
        this.pendingStatusChange = null;
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
            
            html += `
                <button onclick="userManager.changePage(${this.currentPage - 1})" 
                    class="px-4 py-2 border rounded-md text-sm 
                    ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                    이전
                </button>
            `;
            
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
     * 회원 수정 모달 표시
     */
    editUser: async function(userId) {
        console.log('회원 수정 모달 표시:', userId);
        
        try {
            const modal = document.getElementById('user-modal');
            const form = document.getElementById('user-form');
            
            if (!modal || !form) {
                console.error('모달 또는 폼을 찾을 수 없습니다.');
                return;
            }
            
            form.reset();
            
            // 사용자 정보 로드
            const user = await this.getUserById(userId);
            if (!user) {
                window.adminAuth?.showNotification('사용자 정보를 불러올 수 없습니다.', 'error');
                return;
            }
            
            // 사용자 정보 설정
            document.getElementById('user-name').value = user.displayName || '';
            document.getElementById('user-email').value = user.email || '';
            
            const roleSelect = document.getElementById('user-role');
            if (roleSelect) {
                // 관리자가 아닌 경우만 권한 변경 가능
                if (user.userType === 'admin') {
                    roleSelect.innerHTML = '<option value="admin">관리자</option>';
                    roleSelect.disabled = true;
                } else {
                    roleSelect.innerHTML = `
                        <option value="student">수강생</option>
                        <option value="instructor">강사</option>
                    `;
                    roleSelect.disabled = false;
                    // 현재 값 선택
                    for (let option of roleSelect.options) {
                        if (option.value === user.userType) {
                            option.selected = true;
                            break;
                        }
                    }
                }
            }
            
            const statusSelect = document.getElementById('user-status');
            if (statusSelect) {
                // 관리자가 아닌 경우만 상태 변경 가능
                if (user.userType === 'admin') {
                    statusSelect.innerHTML = '<option value="active">활성</option>';
                    statusSelect.disabled = true;
                } else {
                    statusSelect.innerHTML = `
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                        <option value="suspended">정지</option>
                    `;
                    statusSelect.disabled = false;
                    // 현재 값 선택
                    for (let option of statusSelect.options) {
                        if (option.value === user.status) {
                            option.selected = true;
                            break;
                        }
                    }
                }
            }
            
            // 사용자 ID 저장
            form.dataset.userId = userId;
            
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
     * 회원 수정 처리
     */
    handleEditUser: async function(event) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const userId = form.dataset.userId;
            const name = document.getElementById('user-name').value;
            const role = document.getElementById('user-role').value;
            const status = document.getElementById('user-status').value;
            
            // 유효성 검사
            if (!name) {
                window.adminAuth?.showNotification('이름을 입력해주세요.', 'error');
                return;
            }
            
            if (this.isFirebaseAvailable()) {
                const updateData = {
                    displayName: name,
                    userType: role,
                    status: status
                };
                
                try {
                    const result = await window.dbService.updateDocument('users', userId, updateData);
                    
                    if (result.success) {
                        window.adminAuth?.showNotification('회원 정보가 성공적으로 수정되었습니다.', 'success');
                        this.closeUserModal();
                        this.loadUsers();
                        this.updateUserStats();
                    } else {
                        window.adminAuth?.showNotification(`회원 정보 수정 실패: ${result.error?.message || '알 수 없는 오류'}`, 'error');
                    }
                } catch (error) {
                    console.error('회원 정보 수정 오류:', error);
                    window.adminAuth?.showNotification(`회원 정보 수정 오류: ${error.message || '알 수 없는 오류'}`, 'error');
                }
            } else {
                window.adminAuth?.showNotification('데이터베이스에 연결할 수 없습니다.', 'error');
            }
            
        } catch (error) {
            console.error('회원 수정 처리 오류:', error);
            window.adminAuth?.showNotification('회원 정보 수정 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 회원 삭제
     */
    deleteUser: async function(userId) {
        console.log('회원 삭제:', userId);
        
        // 사용자 정보 먼저 확인
        const user = await this.getUserById(userId);
        if (!user) {
            window.adminAuth?.showNotification('사용자 정보를 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 관리자 삭제 방지
        if (user.userType === 'admin') {
            window.adminAuth?.showNotification('관리자 계정은 삭제할 수 없습니다.', 'error');
            return;
        }
        
        const userName = user.displayName || user.email;
        const confirmMessage = `정말로 "${userName}" 회원을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 회원의 모든 데이터가 영구적으로 삭제됩니다.`;
        
        if (confirm(confirmMessage)) {
            // 추가 확인
            const doubleConfirm = confirm(`마지막 확인: "${userName}" 회원을 정말로 삭제하시겠습니까?`);
            if (doubleConfirm) {
                await this.handleDeleteUser(userId);
            }
        }
    },
    
    /**
     * 회원 삭제 처리 (완전 삭제)
     */
    handleDeleteUser: async function(userId) {
        try {
            if (this.isFirebaseAvailable()) {
                try {
                    // 관련 데이터도 함께 삭제
                    await this.deleteRelatedUserData(userId);
                    
                    // 사용자 문서 삭제
                    const result = await window.dbService.deleteDocument('users', userId);
                    
                    if (result.success) {
                        window.adminAuth?.showNotification('회원이 성공적으로 삭제되었습니다.', 'success');
                        this.loadUsers();
                        this.updateUserStats();
                    } else {
                        window.adminAuth?.showNotification(`회원 삭제 실패: ${result.error?.message || '알 수 없는 오류'}`, 'error');
                    }
                } catch (error) {
                    console.error('회원 삭제 오류:', error);
                    window.adminAuth?.showNotification(`회원 삭제 오류: ${error.message || '알 수 없는 오류'}`, 'error');
                }
            } else {
                window.adminAuth?.showNotification('데이터베이스에 연결할 수 없습니다.', 'error');
            }
        } catch (error) {
            console.error('회원 삭제 처리 오류:', error);
            window.adminAuth?.showNotification('회원 삭제 중 오류가 발생했습니다.', 'error');
        }
    },
    
    /**
     * 관련 사용자 데이터 삭제
     */
    deleteRelatedUserData: async function(userId) {
        try {
            if (!window.dbService) return;
            
            // 병렬로 관련 데이터 삭제
            const deletePromises = [
                // 수강 내역 삭제
                this.deleteUserCollection('enrollments', userId),
                // 자격증 정보 삭제
                this.deleteUserCollection('certificates', userId),
                // 결제 내역 삭제
                this.deleteUserCollection('payments', userId),
                // 게시글 삭제
                this.deleteUserCollection('posts', userId),
                // 댓글 삭제
                this.deleteUserCollection('comments', userId)
            ];
            
            await Promise.allSettled(deletePromises);
            console.log('관련 사용자 데이터 삭제 완료');
        } catch (error) {
            console.error('관련 사용자 데이터 삭제 오류:', error);
        }
    },
    
    /**
     * 특정 컬렉션에서 사용자 관련 문서 삭제
     */
    deleteUserCollection: async function(collectionName, userId) {
        try {
            // 사용자 ID로 해당 컬렉션의 문서들 조회
            const result = await window.dbService.getDocuments(collectionName, {
                where: { field: 'userId', operator: '==', value: userId }
            });
            
            if (result.success && result.data.length > 0) {
                // 배치로 삭제
                const deletePromises = result.data.map(doc => 
                    window.dbService.deleteDocument(collectionName, doc.id)
                );
                
                await Promise.all(deletePromises);
                console.log(`${collectionName}에서 ${result.data.length}개 문서 삭제 완료`);
            }
        } catch (error) {
            console.error(`${collectionName} 삭제 오류:`, error);
        }
    },
    
    /**
     * 검색 필터 적용
     */
    applyFilters: function() {
        console.log('검색 필터 적용');
        
        const searchKeyword = document.getElementById('search-keyword')?.value.trim();
        const userType = document.getElementById('filter-role')?.value;
        const status = document.getElementById('filter-status')?.value;
        
        console.log('검색 조건:', { searchKeyword, userType, status });
        
        this.currentPage = 1;
        this.lastDoc = null;
        
        this.loadUsers();
    },
    
    /**
     * 검색 필터 초기화
     */
    resetFilters: function() {
        console.log('검색 필터 초기화');
        
        const searchKeyword = document.getElementById('search-keyword');
        if (searchKeyword) searchKeyword.value = '';
        
        const userType = document.getElementById('filter-role');
        if (userType) userType.value = '';
        
        const status = document.getElementById('filter-status');
        if (status) status.value = '';
        
        this.currentPage = 1;
        this.lastDoc = null;
        
        this.loadUsers();
    }
};

/**
 * 회원 관리 페이지 초기화 함수
 */
window.initUserManagement = async function() {
    try {
        console.log('회원 관리 페이지 초기화 시작');
        
        // Firebase 초기화 대기
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