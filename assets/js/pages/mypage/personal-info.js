/**
 * personal-info.js
 * 개인정보 관리 페이지 기능
 */

(function() {
    // 현재 사용자 정보를 저장할 변수
    let currentUser = null;
    let userProfile = null;

    /**
     * 페이지 초기화
     */
    async function initializePage() {
        try {
            // 인증 상태 확인
            if (!window.mypageHelpers.checkAuthState()) {
                return;
            }

            // 사용자 정보 로드
            await loadUserProfile();

            // 이벤트 리스너 설정
            setupEventListeners();

        } catch (error) {
            console.error('페이지 초기화 오류:', error);
            window.mypageHelpers.showNotification('페이지 초기화 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 사용자 프로필 정보 로드
     */
    async function loadUserProfile() {
        try {
            // 현재 로그인한 사용자 정보 가져오기
            userProfile = await window.mypageHelpers.loadUserInfo();
            
            if (!userProfile) {
                throw new Error('사용자 정보를 가져올 수 없습니다.');
            }

            // 폼에 사용자 정보 채우기
            populateUserInfo(userProfile);

            // 프로필 사진 표시
            if (userProfile.photoURL) {
                displayProfilePhoto(userProfile.photoURL);
            }

        } catch (error) {
            console.error('사용자 정보 로드 오류:', error);
            window.mypageHelpers.showNotification('사용자 정보를 불러오는데 실패했습니다.', 'error');
        }
    }

    /**
     * 폼에 사용자 정보 채우기
     * @param {object} userData - 사용자 데이터
     */
    function populateUserInfo(userData) {
        document.getElementById('name').value = userData.displayName || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('phone').value = userData.phoneNumber || '';
        document.getElementById('birthdate').value = userData.birthdate || '';
        document.getElementById('address').value = userData.address || '';

        // 성별 라디오 버튼 설정
        if (userData.gender) {
            const genderRadio = document.querySelector(`input[name="gender"][value="${userData.gender}"]`);
            if (genderRadio) {
                genderRadio.checked = true;
            }
        }
    }

    /**
     * 프로필 사진 표시
     * @param {string} photoURL - 사진 URL
     */
    function displayProfilePhoto(photoURL) {
        const photoPreview = document.getElementById('profile-photo-preview');
        photoPreview.innerHTML = `<img src="${photoURL}" alt="프로필 사진" class="w-full h-full object-cover">`;
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 프로필 사진 업로드 버튼
        document.getElementById('upload-photo-btn').addEventListener('click', function() {
            document.getElementById('profile-photo-input').click();
        });

        // 프로필 사진 입력 변경
        document.getElementById('profile-photo-input').addEventListener('change', handlePhotoUpload);

        // 프로필 사진 삭제 버튼
        document.getElementById('remove-photo-btn').addEventListener('click', handlePhotoRemove);

        // 개인정보 수정 폼 제출
        document.getElementById('personal-info-form').addEventListener('submit', handlePersonalInfoSubmit);

        // 비밀번호 변경 폼 제출
        document.getElementById('password-change-form').addEventListener('submit', handlePasswordChange);

        // 회원 탈퇴 버튼
        document.getElementById('account-delete-btn').addEventListener('click', handleAccountDelete);
    }

    /**
     * 프로필 사진 업로드 처리
     * @param {Event} event - 이벤트 객체
     */
    async function handlePhotoUpload(event) {
        const file = event.target.files[0];
        
        if (!file) return;

        // 파일 유효성 검사
        if (!file.type.startsWith('image/')) {
            window.mypageHelpers.showNotification('이미지 파일만 업로드 가능합니다.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB 제한
            window.mypageHelpers.showNotification('파일 크기는 5MB 이하여야 합니다.', 'error');
            return;
        }

        try {
            // 로딩 상태 표시
            const uploadBtn = document.getElementById('upload-photo-btn');
            uploadBtn.disabled = true;
            uploadBtn.textContent = '업로드 중...';

            // Storage에 파일 업로드
            const user = window.authService.getCurrentUser();
            const fileExtension = file.name.split('.').pop();
            const fileName = `profile-photos/${user.uid}/profile.${fileExtension}`;
            
            const uploadResult = await window.storageService.uploadFile(file, fileName, {
                customMetadata: {
                    userId: user.uid,
                    uploadedAt: new Date().toISOString()
                }
            });

            if (uploadResult.success) {
                // 프로필 업데이트
                const updateResult = await window.authService.updateProfile({
                    photoURL: uploadResult.downloadURL
                });

                if (updateResult.success) {
                    displayProfilePhoto(uploadResult.downloadURL);
                    window.mypageHelpers.showNotification('프로필 사진이 업로드되었습니다.', 'success');
                } else {
                    throw new Error('프로필 업데이트 실패');
                }
            } else {
                throw new Error('파일 업로드 실패');
            }

        } catch (error) {
            console.error('사진 업로드 오류:', error);
            window.mypageHelpers.showNotification('사진 업로드 중 오류가 발생했습니다.', 'error');
        } finally {
            // 버튼 상태 복원
            const uploadBtn = document.getElementById('upload-photo-btn');
            uploadBtn.disabled = false;
            uploadBtn.textContent = '사진 변경';
        }
    }

    /**
     * 프로필 사진 삭제 처리
     */
    async function handlePhotoRemove() {
        try {
            window.mypageHelpers.showConfirmDialog(
                '프로필 사진을 삭제하시겠습니까?',
                async function() {
                    try {
                        // 프로필 업데이트 (photoURL 제거)
                        const updateResult = await window.authService.updateProfile({
                            photoURL: null
                        });

                        if (updateResult.success) {
                            // 기본 아이콘으로 변경
                            const photoPreview = document.getElementById('profile-photo-preview');
                            photoPreview.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" class="profile-photo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            `;
                            window.mypageHelpers.showNotification('프로필 사진이 삭제되었습니다.', 'success');
                        } else {
                            throw new Error('프로필 업데이트 실패');
                        }
                    } catch (error) {
                        console.error('사진 삭제 오류:', error);
                        window.mypageHelpers.showNotification('사진 삭제 중 오류가 발생했습니다.', 'error');
                    }
                }
            );
        } catch (error) {
            console.error('사진 삭제 오류:', error);
        }
    }

    /**
     * 개인정보 수정 폼 제출 처리
     * @param {Event} event - 이벤트 객체
     */
    async function handlePersonalInfoSubmit(event) {
        event.preventDefault();

        // 폼 유효성 검사
        if (!window.mypageHelpers.validateForm(event.target)) {
            return;
        }

        try {
            // 폼 데이터 수집
            const formData = new FormData(event.target);
            const userData = {
                displayName: formData.get('name'),
                phoneNumber: formData.get('phone'),
                birthdate: formData.get('birthdate'),
                address: formData.get('address'),
                gender: formData.get('gender')
            };

            // 전화번호 포맷팅
            if (userData.phoneNumber) {
                userData.phoneNumber = window.formatters.formatPhoneNumber(userData.phoneNumber);
            }

            // 프로필 업데이트
            const updateResult = await window.authService.updateProfile(userData);

            if (updateResult.success) {
                window.mypageHelpers.showNotification('개인정보가 수정되었습니다.', 'success');
            } else {
                throw new Error(updateResult.error.message || '프로필 업데이트 실패');
            }

        } catch (error) {
            console.error('개인정보 수정 오류:', error);
            window.mypageHelpers.showNotification('개인정보 수정 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 비밀번호 변경 처리
     * @param {Event} event - 이벤트 객체
     */
    async function handlePasswordChange(event) {
        event.preventDefault();

        try {
            // 폼 데이터 수집
            const formData = new FormData(event.target);
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');

            // 새 비밀번호 확인
            if (newPassword !== confirmPassword) {
                window.mypageHelpers.showNotification('새 비밀번호가 일치하지 않습니다.', 'error');
                return;
            }

            // 비밀번호 유효성 검사
            const validation = window.validators.validatePassword(newPassword);
            if (!validation.isValid) {
                window.mypageHelpers.showNotification(validation.errors.join('\n'), 'error');
                return;
            }

            // 비밀번호 변경
            const result = await window.authService.changePassword(currentPassword, newPassword);

            if (result.success) {
                window.mypageHelpers.showNotification('비밀번호가 변경되었습니다.', 'success');
                event.target.reset();
            } else {
                throw new Error(result.error.message || '비밀번호 변경 실패');
            }

        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            let errorMessage = '비밀번호 변경 중 오류가 발생했습니다.';
            
            // Firebase 에러 메시지 처리
            if (error.code === 'auth/wrong-password') {
                errorMessage = '현재 비밀번호가 올바르지 않습니다.';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = '보안을 위해 다시 로그인해주세요.';
            }
            
            window.mypageHelpers.showNotification(errorMessage, 'error');
        }
    }

    /**
     * 회원 탈퇴 처리
     */
    async function handleAccountDelete() {
        window.mypageHelpers.showConfirmDialog(
            '정말로 회원 탈퇴를 하시겠습니까?\n탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.',
            async function() {
                // 비밀번호 재확인 모달 또는 프롬프트 필요
                const password = prompt('비밀번호를 입력하세요:');
                
                if (!password) {
                    return;
                }

                try {
                    const result = await window.authService.deleteAccount(password);
                    
                    if (result.success) {
                        window.mypageHelpers.showNotification('회원 탈퇴가 완료되었습니다.', 'success');
                        // 로그인 페이지로 이동
                        setTimeout(() => {
                            window.location.href = '/pages/auth/login.html';
                        }, 1500);
                    } else {
                        throw new Error(result.error.message || '회원 탈퇴 실패');
                    }
                } catch (error) {
                    console.error('회원 탈퇴 오류:', error);
                    let errorMessage = '회원 탈퇴 중 오류가 발생했습니다.';
                    
                    if (error.code === 'auth/wrong-password') {
                        errorMessage = '비밀번호가 올바르지 않습니다.';
                    } else if (error.code === 'auth/requires-recent-login') {
                        errorMessage = '보안을 위해 다시 로그인해주세요.';
                    }
                    
                    window.mypageHelpers.showNotification(errorMessage, 'error');
                }
            }
        );
    }

    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', initializePage);
})();