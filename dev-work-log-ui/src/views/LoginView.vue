<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MD5 from 'crypto-js/md5'

const router = useRouter()
const authStore = useAuthStore()

const identifier = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  const hashedPassword = MD5(password.value).toString()

  try {
    const res = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier.value, password: hashedPassword })
    })

    const json = await res.json()
    if (json.code === 200 && json.data) {
      authStore.user = {
        id: json.data.id,
        name: json.data.name,
        avatar: '',
        avatarChar: json.data.avatar_char,
        email: json.data.username + '@enterprise.com',
        department: json.data.group_name || '未分配部门',
        identifier: json.data.username,
        job_desc: json.data.job_desc || '暂无岗位描述',
        theme_color: json.data.theme_color || 'primary'
      }
      router.push('/dashboard')
    } else {
      errorMessage.value = json.msg || '登录失败，请检查账号和密码'
    }
  } catch (err) {
    errorMessage.value = '无法连接到后端服务器，请确认服务端已启动'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center selection:bg-primary-fixed selection:text-on-primary-fixed relative">
    <!-- Subtle Architectural Background Detail -->
    <div class="fixed top-0 right-0 p-12 opacity-5 pointer-events-none hidden lg:block text-primary">
      <span class="material-symbols-outlined text-[12rem]">architecture</span>
    </div>
    <div class="fixed bottom-0 left-0 p-12 opacity-5 pointer-events-none hidden lg:block text-primary">
      <span class="material-symbols-outlined text-[12rem]">inventory_2</span>
    </div>

    <!-- Auth Canvas -->
    <main class="w-full max-w-md px-6 py-12 relative z-10">
      <!-- Brand Identity Section -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface-container-low mb-6">
          <span class="material-symbols-outlined text-primary text-4xl">edit_note</span>
        </div>
        <h1 class="font-headline text-3xl font-extrabold tracking-tight text-primary mb-2">
          研发工作登记系统
        </h1>
        <p class="text-on-surface-variant font-medium tracking-wide text-sm opacity-80 uppercase">
          Enterprise Editorial Workspace
        </p>
      </div>

      <!-- Login Ledger Card -->
      <div class="bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_32px_rgba(0,72,141,0.06)]">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email/User Input -->
          <div class="space-y-2">
            <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase pl-1" for="identifier">
              用户名或企业邮箱
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-outline text-lg">alternate_email</span>
              </div>
              <input 
                v-model="identifier"
                class="block w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-0 focus:bg-surface-container-lowest transition-all duration-200 text-on-surface placeholder-outline-variant outline-none" 
                id="identifier" placeholder="登录账号 (如: zhangwei)" required type="text"
              />
              <div class="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-focus-within:w-full transition-all duration-300"></div>
            </div>
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <div class="flex justify-between items-center px-1">
              <label class="font-label text-xs font-bold text-on-surface-variant tracking-wider uppercase" for="password">
                密码
              </label>
              <a class="text-xs font-semibold text-primary hover:underline decoration-2 underline-offset-4" href="#">忘记密码？</a>
            </div>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-outline text-lg">lock</span>
              </div>
              <input 
                v-model="password"
                class="block w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-0 focus:bg-surface-container-lowest transition-all duration-200 text-on-surface placeholder-outline-variant outline-none" 
                id="password" placeholder="••••••••" required type="password"
              />
              <div class="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-focus-within:w-full transition-all duration-300"></div>
            </div>
          </div>

          <!-- Remember Me Toggle -->
          <div class="flex items-center justify-between px-1">
            <div class="flex flex-row items-center">
              <input class="h-4 w-4 text-primary focus:ring-primary-container border-outline-variant rounded bg-surface-container-low transition-colors" id="remember-me" type="checkbox"/>
              <label class="ml-3 block text-sm font-medium text-on-surface-variant" for="remember-me">
                保持登录状态
              </label>
            </div>
          </div>

          <!-- Error Message Display -->
          <div v-if="errorMessage" class="text-error text-xs font-bold bg-error/10 p-2.5 rounded text-center animate-pulse">
            {{ errorMessage }}
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button class="w-full py-3.5 px-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold text-sm tracking-widest rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2" type="submit">
              <span>登录系统</span>
              <span class="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Secondary Actions -->
      <div class="mt-8 text-center space-y-4">
        <p class="text-on-surface-variant text-xs">
          还没有账户？ <a class="text-primary font-bold hover:underline underline-offset-4" href="#">联系管理员申请</a>
        </p>
        <div class="flex items-center justify-center space-x-4 pt-4">
          <div class="h-[1px] w-8 bg-surface-dim"></div>
          <span class="text-[10px] font-label font-bold text-outline tracking-widest uppercase">Secured Access</span>
          <div class="h-[1px] w-8 bg-surface-dim"></div>
        </div>
      </div>
    </main>
  </div>
</template>
