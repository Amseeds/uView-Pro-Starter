<script setup lang="ts">
import type { ColorType } from 'uview-pro/types/global'
import { $u } from 'uview-pro'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 响应式数据
const ws = ref(null)
const userId = ref(`user_${Math.random().toString(36).substring(2, 11)}`)
const statusText = ref('连接中...')
const statusClass = ref('connecting')
const onlineCount = ref(0)
const messages = ref([])
const inputMessage = ref('')
const scrollTop = ref(0)
let wsUrl = 'ws://127.0.0.1:8000/api/chat/ws' // 基础地址，APP端会条件编译覆盖

// 语音相关
const isVoiceMode = ref(false)
const isRecording = ref(false)
const recordingStatus = ref('按住1说话')
const recognition = ref(null)
const recorderManager = ref(null)
const voiceFilePath = ref('')

// ========== 工具函数 ==========
function formatTime(timestamp) {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function scrollToBottom() {
  scrollTop.value = 999999
}

// ========== 消息处理 ==========
function addSystemMessage(content) {
  messages.value.push({
    type: 'system',
    content,
  })
  nextTick(() => {
    scrollToBottom()
  })
}

function addChatMessage(senderId, content, timestamp, msgType = 'text', duration = null) {
  messages.value.push({
    type: 'chat',
    userId: senderId,
    content,
    timestamp,
    msgType,
    duration,
    isMine: senderId === userId.value,
  })
  nextTick(() => {
    scrollToBottom()
  })
}

function showRecognitionResult() {
  uni.showModal({
    title: '语音识别成功',
    content: `识别结果: ${inputMessage.value}`,
    confirmText: '发送',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        sendMessage()
      }
    },
  })
}

// ========== 消息发送 ==========
function sendMessage() {
  const content = inputMessage.value.trim()
  if (!content)
    return

  try {
    uni.sendSocketMessage({
      data: JSON.stringify({
        type: 'chat',
        user_id: userId.value,
        content,
      }),
      success: () => {
        inputMessage.value = ''
      },
      fail: () => {
        uni.showToast({
          title: '未连接到服务器',
          icon: 'none',
        })
      },
    })
  }
  catch (e) {
    uni.showToast({
      title: '发送失败',
      icon: 'none',
    })
  }
}

// ========== 语音消息播放 ==========
function playVoice(msg) {
  const innerAudioContext = uni.createInnerAudioContext()
  innerAudioContext.src = msg.content
  innerAudioContext.play()

  innerAudioContext.onPlay(() => {
    msg.isPlaying = true
  })

  innerAudioContext.onEnded(() => {
    msg.isPlaying = false
    innerAudioContext.destroy()
  })

  innerAudioContext.onError((err) => {
    console.error('播放失败:', err)
    uni.showToast({
      title: '播放失败',
      icon: 'none',
    })
    msg.isPlaying = false
    innerAudioContext.destroy()
  })
}

// ========== WebSocket 连接 ==========
function closeConnection() {
  if (ws.value) {
    uni.closeSocket()
    ws.value = null
  }
}

function connect() {
  try {
    const socketTask = uni.connectSocket({
      url: `${wsUrl}?user_id=${userId.value}`,
    })
    ws.value = socketTask

    uni.onSocketOpen(() => {
      statusText.value = '已连接'
      statusClass.value = 'connected'
      addSystemMessage('欢迎加入聊天室！')
      console.log('WebSocket 连接成功')
    })

    uni.onSocketMessage((res) => {
      try {
        const data = JSON.parse(res.data)
        if (data.type === 'system') {
          addSystemMessage(data.content)
          onlineCount.value = data.online_count || 0
        }
        else if (data.type === 'chat') {
          addChatMessage(data.user_id, data.content, data.timestamp, 'text')
        }
        else if (data.type === 'voice') {
          addChatMessage(data.user_id, data.content, data.timestamp, 'voice', data.duration)
        }
      }
      catch (e) {
        console.error('解析消息失败:', e)
      }
    })

    uni.onSocketClose(() => {
      statusText.value = '连接已断开'
      statusClass.value = 'disconnected'
      console.log('WebSocket 连接关闭')
      // 3秒后重连
      setTimeout(() => {
        if (ws.value) {
          connect()
        }
      }, 3000)
    })

    uni.onSocketError((err) => {
      statusText.value = '连接错误'
      statusClass.value = 'disconnected'
      console.error('WebSocket 错误:', err)
    })
  }
  catch (e) {
    console.error('连接失败:', e)
    statusText.value = '连接失败'
    statusClass.value = 'disconnected'
  }
}

// ========== 语音识别与录音（后端） ==========
function sendVoiceToTextMessage() {
  uni.showLoading({
    title: '识别中...',
  })

  uni.uploadFile({
    url: 'http://127.0.0.1:8000/api/chat/speech-to-text',
    filePath: voiceFilePath.value,
    name: 'audio',
    formData: {
      user_id: userId.value,
    },
    success: (res) => {
      uni.hideLoading()
      try {
        const data = JSON.parse(res.data)
        if (data.text) {
          inputMessage.value = data.text
          showRecognitionResult()
          voiceFilePath.value = ''
        }
        else {
          uni.showToast({
            title: '识别失败',
            icon: 'none',
          })
        }
      }
      catch (e) {
        uni.showToast({
          title: '识别失败',
          icon: 'none',
        })
      }
    },
    fail: () => {
      uni.hideLoading()
      uni.showToast({
        title: '上传失败',
        icon: 'none',
      })
    },
  })
}

function handleRecordingComplete() {
  if (voiceFilePath.value) {
    uni.showModal({
      title: '录音完成',
      content: '是否识别语音为文字?',
      success: (res) => {
        if (res.confirm) {
          sendVoiceToTextMessage()
        }
      },
    })
  }
}

function initRecorder() {
  // 只在非H5环境或H5不支持语音识别时初始化录音管理器
  if (typeof window === 'undefined' || !window.SpeechRecognition) {
    recorderManager.value = uni.getRecorderManager()
    recorderManager.value.onStop((res) => {
      voiceFilePath.value = res.tempFilePath
      handleRecordingComplete()
    })
    recorderManager.value.onError((err) => {
      console.error('录音错误:', err)
      uni.showToast({
        title: '录音失败',
        icon: 'none',
      })
      isRecording.value = false
      recordingStatus.value = '按住说话'
    })
  }
}

// ========== 浏览器语音识别（H5） ==========
function initSpeechRecognition() {
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition.value = new SpeechRecognition()
    recognition.value.continuous = false
    recognition.value.interimResults = true
    recognition.value.lang = 'zh-CN'

    recognition.value.onstart = () => {
      console.log('语音识别开始')
    }

    recognition.value.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
        else {
          interimTranscript += transcript
        }
      }
      if (finalTranscript) {
        inputMessage.value = finalTranscript
      }
    }

    recognition.value.onerror = (event) => {
      console.error('语音识别错误:', event.error)
      recordingStatus.value = '按住说话'
    }

    recognition.value.onend = () => {
      console.log('语音识别结束')
      recognition.value.started = false
      recordingStatus.value = '按住说话'

      if (inputMessage.value.trim()) {
        showRecognitionResult()
      }
    }
  }
  else {
    console.log('H5端: 浏览器不支持语音识别')
  }
}

// ========== 录音控制 ==========
function startRecording(e) {
  e.preventDefault()
  isRecording.value = true
  recordingStatus.value = '录音中...'

  if (recognition.value) {
    try {
      recognition.value.started = true
      recognition.value.start()
    }
    catch (e) {
      console.error('启动语音识别失败:', e)
    }
    return
  }

  if (recorderManager.value) {
    recorderManager.value.start({
      format: 'mp3',
      duration: 60000,
    })
  }
}

function stopRecording(e) {
  e.preventDefault()
  if (!isRecording.value)
    return

  isRecording.value = false

  if (recognition.value && recognition.value.started) {
    recognition.value.stop()
    recordingStatus.value = '按住说话'
    return
  }

  if (recorderManager.value) {
    recorderManager.value.stop()
    recordingStatus.value = '按住说话'
  }
}

function cancelRecording(e) {
  e.preventDefault()
  isRecording.value = false

  if (recognition.value && recognition.value.started) {
    recognition.value.stop()
    recordingStatus.value = '按住说话'
    return
  }

  if (recorderManager.value) {
    recorderManager.value.stop()
    recordingStatus.value = '按住说话'
  }
}

function toggleVoiceMode() {
  isVoiceMode.value = !isVoiceMode.value
}

// ========== 生命周期 ==========
onMounted(() => {
  // #ifdef APP-PLUS
  wsUrl = 'ws://192.168.31.171:8000/api/chat/ws'
  console.log('移动端配置为正确的地址')
  // #endif

  connect()
  initRecorder()
  initSpeechRecognition()
})

onUnmounted(() => {
  closeConnection()
})
</script>

<template>
  <app-page :nav-title="$t('common.chat')" :show-tabbar="false">
    <view class="app-container">
      <view class="header">
        <view class="status" :class="statusClass">
          {{ statusText }}
        </view>
        <view v-if="onlineCount > 0" class="online-info">
          在线人数: {{ onlineCount }}
        </view>
      </view>
      <view class="content-scroll">
        <scroll-view class="messages" scroll-y :scroll-top="scrollTop">
          <view class="scroll-container">
            <view
              v-for="(msg, index) in messages"
              :key="index"
              class="message"
              :class="
                msg.type === 'system' ? 'system' : msg.isMine ? 'mine' : 'other'
              "
            >
              <view v-if="msg.type === 'system'" class="message-content system">
                {{
                  msg.content
                }}
              </view>
              <view v-else>
                <view v-if="msg.timestamp" class="message-time">
                  {{
                    formatTime(msg.timestamp)
                  }}
                </view>
                <view class="chat-message">
                  <image
                    class="avatar"
                    src="/static/logo.png"
                    mode="aspectFill"
                  />
                  <!-- 文字消息 -->
                  <view
                    v-if="msg.msgType === 'text' || !msg.msgType"
                    class="message-content bubble"
                  >
                    {{ msg.content }}
                  </view>
                  <!-- 语音消息 -->
                  <view
                    v-else-if="msg.msgType === 'voice'"
                    class="message-content bubble voice-bubble"
                    @click="playVoice(msg)"
                  >
                    <text class="voice-icon">
                      🎤
                    </text>
                    <text class="voice-duration">
                      {{ msg.duration }}"
                    </text>
                    <text v-if="msg.isPlaying" class="playing-icon">
                      播放中...
                    </text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
      <view class="input-area">
        <view class="input-wrapper">
          <!-- 切换到语音输入模式按钮 -->
          <view v-if="!isVoiceMode" class="voice-toggle" @click="toggleVoiceMode">
            <text>🎤</text>
          </view>
          <!-- 切换到键盘输入模式按钮 -->
          <view v-else class="voice-toggle" @click="toggleVoiceMode">
            <text>⌨️</text>
          </view>

          <!-- 文字输入框 -->
          <input
            v-if="!isVoiceMode"
            v-model="inputMessage"
            class="message-input"
            placeholder="输入消息..."
            @confirm="sendMessage"
          >

          <!-- 按住说话按钮 -->
          <view
            v-else
            class="voice-btn"
            @touchstart="startRecording"
            @touchend="stopRecording"
            @touchcancel="cancelRecording"
          >
            {{ recordingStatus }}
          </view>

          <view
            v-if="inputMessage.trim() && !isVoiceMode"
            class="send-btn"
            @click="sendMessage"
          >
            发送
          </view>
        </view>
        <!-- 录音提示 -->
        <view v-if="isRecording" class="recording-tip">
          <view class="recording-wave" />
          <text>正在录音，松开结束</text>
        </view>
      </view>
    </view>
  </app-page>
</template>

<style lang="scss" scoped>
.app-container {
  background: linear-gradient(180deg, rgba(41, 121, 255, 0.03) 0%, transparent 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.status {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.status.connecting {
  background-color: #ff9800;
  color: #fff;
}

.status.connected {
  background-color: #4caf50;
  color: #fff;
}

.status.disconnected {
  background-color: #f44336;
  color: #fff;
}

.online-info {
  font-size: 24rpx;
  color: #666;
}

.messages {
  flex: 1;
  padding: 0 20rpx;
  overflow-y: auto;
  box-sizing: border-box;
}

.message {
  margin-bottom: 30rpx;
  box-sizing: border-box;
}

.message.other {
  text-align: left;
}

.message.mine {
  text-align: right;
}

.message-time {
  font-size: 22rpx;
  color: #999;
  text-align: center;
  margin-bottom: 15rpx;
}

.message.system {
  text-align: center;
}

.message-content.system {
  display: inline-block;
  padding: 10rpx 30rpx;
  background-color: #e0e0e0;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #666;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 28rpx;
  max-width: 75%;
}

.message.other .chat-message {
  flex-direction: row;
}

.message.mine .chat-message {
  flex-direction: row-reverse;
  margin-left: auto;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
  background-color: #f0f0f0;
}

.message.mine .message-content {
  background-color: #95ec69;
  color: #333;
  border-radius: 16rpx;
  position: relative;
}

.message.mine .message-content::before {
  content: "";
  position: absolute;
  right: -12rpx;
  top: 24rpx;
  width: 0;
  height: 0;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  border-left: 14rpx solid #95ec69;
}

.message.other .message-content {
  background-color: #fff;
  color: #333;
  border-radius: 16rpx;
  position: relative;
}

.message.other .message-content::before {
  content: "";
  position: absolute;
  left: -12rpx;
  top: 24rpx;
  width: 0;
  height: 0;
  border-top: 12rpx solid transparent;
  border-bottom: 12rpx solid transparent;
  border-right: 14rpx solid #fff;
}

.message-content {
  padding: 20rpx 24rpx;
  font-size: 30rpx;
  text-align: left;
  line-height: 1.6;
  word-wrap: break-word;
  word-break: break-all;
  max-width: 100%;
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
}

/* 语音消息气泡 */
.voice-bubble {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 120rpx;
}

.voice-icon {
  font-size: 36rpx;
}

.voice-duration {
  font-size: 26rpx;
  color: #666;
}

.playing-icon {
  font-size: 22rpx;
  color: #007aff;
}

.input-area {
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
}

.input-wrapper {
  display: flex;
  align-items: center;
  height: 70rpx;
  background-color: #f5f5f5;
  border-radius: 35rpx;
  overflow: hidden;
}

.message-input {
  flex: 1;
  height: 100%;
  padding: 0 20rpx;
  background-color: transparent;
  border: none;
  font-size: 28rpx;
}

.send-btn {
  padding: 0 30rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #007aff;
  color: #fff;
  font-size: 26rpx;
  transition: all 0.3s ease;
}

.voice-toggle {
  width: 80rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 36rpx;
}

.voice-btn {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 35rpx;
  color: #333;
  font-size: 28rpx;
}

.recording-tip {
  position: fixed;
  bottom: 200rpx;
  left: 50%;
  transform: translateX(-50%);
  padding: 20rpx 40rpx;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 30rpx;
  color: #fff;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  gap: 15rpx;
  z-index: 100;
}

.recording-wave {
  width: 20rpx;
  height: 20rpx;
  background-color: #f44336;
  border-radius: 50%;
  animation: wave 1s infinite;
}

@keyframes wave {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}
</style>
