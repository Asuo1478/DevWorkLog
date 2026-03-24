<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const userProfile = computed(() => {
  return {
    name: authStore.user.name,
    email: authStore.user.email,
    no: authStore.user.identifier,
    group: authStore.user.department,
    role: authStore.user.job_desc || '暂无岗位描述',
    status: '正常启用',
    avatar: authStore.user.avatar,
    avatarChar: authStore.user.avatarChar,
    theme_color: String(authStore.user.theme_color || 'primary')
  }
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordSuccess = ref(false)
const passwordError = ref('')
const isSubmitting = ref(false)

const handlePasswordReset = async () => {
  passwordError.value = ''
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = "新密码与确认密码不一致"
    return
  }
  if (!passwordForm.value.currentPassword) {
    passwordError.value = "请输入当前密码以验证权限"
    return
  }

  isSubmitting.value = true

  try {
    const res = await fetch(`/api/v1/users/${authStore.user.id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      })
    })
    
    const json = await res.json()
    if (json.code === 200) {
      passwordSuccess.value = true
      passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
      setTimeout(() => {
          passwordSuccess.value = false
      }, 3000)
    } else {
      passwordError.value = json.msg || '密码修改失败'
    }
  } catch (err) {
    passwordError.value = `服务器连接异常: ${err.message || err}`
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="px-12 py-8 max-w-5xl mx-auto space-y-10">
    <!-- Header Section -->
    <div class="mb-8">
      <h2 class="font-headline text-3xl font-extrabold tracking-tight text-primary mb-2">个人中心</h2>
      <p class="font-body text-on-surface-variant text-lg">查看个人资料与管理账号安全设置。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Read-only Profile Details -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
          <h3 class="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">account_circle</span>
            基本资料
          </h3>
          
          <div class="flex items-center gap-6 mb-8 pb-8 border-b border-outline-variant/10">
            <div :class="`w-20 h-20 rounded-full ring-4 ring-primary/5 flex items-center justify-center font-bold text-3xl overflow-hidden shadow-md bg-${userProfile.theme_color}-fixed text-${userProfile.theme_color}`">
              <template v-if="userProfile.avatar">
                <img :src="userProfile.avatar" class="w-full h-full object-cover" />
              </template>
              <template v-else>
                {{ userProfile.avatarChar }}
              </template>
            </div>
            <div>
              <p class="font-bold text-2xl text-on-surface">{{ userProfile.name }}</p>
              <span class="inline-block mt-2 px-3 py-1 bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant text-[10px] font-bold rounded-full uppercase tracking-wider">
                ● {{ userProfile.status }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-y-6 gap-x-4">
            <div class="space-y-1">
              <label class="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">邮箱地址</label>
              <div class="bg-surface-container-low px-4 py-3 rounded-lg text-sm text-on-surface/60 font-medium cursor-not-allowed select-none">
                {{ userProfile.email }}
              </div>
            </div>
            
            <div class="space-y-1">
              <label class="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">工号/登录账号</label>
              <div class="bg-surface-container-low px-4 py-3 rounded-lg text-sm text-on-surface/60 font-mono cursor-not-allowed select-none">
                {{ userProfile.no }}
              </div>
            </div>
            
            <div class="space-y-1">
              <label class="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">所属小组</label>
              <div class="bg-surface-container-low px-4 py-3 rounded-lg text-sm text-on-surface/60 font-medium cursor-not-allowed select-none">
                {{ userProfile.group }}
              </div>
            </div>
            
            <div class="space-y-1">
              <label class="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">岗位角色</label>
              <div class="bg-surface-container-low px-4 py-3 rounded-lg text-sm text-on-surface/60 font-medium cursor-not-allowed select-none">
                {{ userProfile.role }}
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 text-xs text-outline-variant font-medium flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px]">info</span>
            个人资料仅供展示，如需修改请联系系统管理员。
          </div>
        </div>
      </div>

      <!-- Password Reset Form -->
      <div class="lg:col-span-1">
        <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-error/10 relative overflow-hidden h-full">
          <div class="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-bl-[100px] pointer-events-none -z-0"></div>
          
          <h3 class="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2 relative z-10">
            <span class="material-symbols-outlined text-error">lock_reset</span>
            修改登录密码
          </h3>

          <form @submit.prevent="handlePasswordReset" class="space-y-5 relative z-10">
            <div class="space-y-1.5">
              <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">当前密码 <span class="text-error">*</span></label>
              <input v-model="passwordForm.currentPassword" type="password" placeholder="请输入当前密码以验证" required class="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-error/20 focus:border-error/30 text-on-surface outline-none transition-all font-medium" />
            </div>
            
            <div class="space-y-1.5">
              <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">新密码 <span class="text-error">*</span></label>
              <input v-model="passwordForm.newPassword" type="password" placeholder="设置新的登录密码" required class="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-error/20 focus:border-error/30 text-on-surface outline-none transition-all font-medium" />
            </div>
            
            <div class="space-y-1.5">
              <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1">确认新密码 <span class="text-error">*</span></label>
              <input v-model="passwordForm.confirmPassword" type="password" placeholder="再次确认新密码" required class="w-full bg-surface-container-low border border-transparent rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-error/20 focus:border-error/30 text-on-surface outline-none transition-all font-medium" />
            </div>

            <button type="submit" :disabled="isSubmitting" class="w-full mt-4 py-3 bg-error hover:bg-error/90 text-on-error rounded-lg font-bold text-sm shadow-md transition-colors active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-sm">key</span>
              {{ isSubmitting ? '提交中...' : '重置并更新密码' }}
            </button>
            <p v-if="passwordError" class="text-error text-xs font-bold text-center mt-3 bg-error/10 py-2 rounded animate-pulse">
              {{ passwordError }}
            </p>
            <p v-if="passwordSuccess" class="text-tertiary text-xs font-bold text-center mt-3 bg-tertiary/10 py-2 rounded">
              登录密码已成功更新！
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
