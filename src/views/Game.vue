<template>
  <div class="game-page" :class="{ 'guest-mode': !isLoggedIn }">
    <div class="game-header">
      <h1>🎮 休闲区</h1>
      <p class="subtitle">多种娱乐方式，放松身心</p>
    </div>

    <!-- 游戏切换标签 -->
    <div class="game-tabs">
      <button :class="{ active: gameTab === 'liar' }" @click="handleGameTabClick('liar')">
        🎲 吹牛大赛
      </button>
      <button :class="{ active: gameTab === 'wheel' }" @click="handleGameTabClick('wheel')">
        🎡 幸运转盘
      </button>
    </div>

    <!-- 未登录遮罩 -->
    <div v-if="!isLoggedIn" class="guest-block-overlay" @click="requireLogin('登录后即可畅玩所有游戏')">
      <div class="guest-block-hint">
        <span class="guest-lock-icon">🔒</span>
        <span>登录后即可畅玩</span>
      </div>
    </div>

    <!-- 吹牛游戏 -->
    <template v-if="gameTab === 'liar'">
    <!-- 游戏状态 -->
    <div v-if="!gameStarted" class="start-section">
      <GlassCard class="start-card">
        <h2>游戏设置</h2>
        <div class="setting-row">
          <label>玩家数量</label>
          <div class="player-btns">
            <button 
              v-for="n in 3" 
              :key="n" 
              :class="{ active: playerCount === n + 1 }"
              @click="playerCount = n + 1"
            >{{ n + 1 }}人</button>
          </div>
        </div>
        <div class="setting-row">
          <label>AI 难度</label>
          <div class="player-btns">
            <button :class="{ active: aiLevel === 'easy' }" @click="aiLevel = 'easy'">简单</button>
            <button :class="{ active: aiLevel === 'normal' }" @click="aiLevel = 'normal'">普通</button>
            <button :class="{ active: aiLevel === 'hard' }" @click="aiLevel = 'hard'">困难</button>
          </div>
        </div>
        <button class="start-btn" @click="startGame">开始游戏</button>
      </GlassCard>
    </div>

    <!-- 游戏进行中 -->
    <div v-else class="game-board">
      <!-- 当前喊注 -->
      <GlassCard class="current-bid-card">
        <div class="bid-info">
          <div class="bid-player">
            <span class="player-icon">{{ currentPlayer.avatar }}</span>
            <span class="player-name">{{ currentPlayer.name }}</span>
            <span class="player-label" v-if="currentPlayer.isAI">🤖 AI</span>
          </div>
          <div class="bid-content">
            喊注: <strong class="bid-count">{{ currentBid.count }}</strong> 个 
            <strong class="bid-face">{{ currentBid.face }}</strong>
          </div>
        </div>
        <p v-if="currentBid.count === 0" class="no-bid">等待开场...</p>
      </GlassCard>

      <!-- 玩家区域 -->
      <div class="players-area">
        <div 
          v-for="(player, idx) in players" 
          :key="player.id"
          class="player-section"
          :class="{ active: currentPlayerIndex === idx, winner: winnerId === player.id }"
        >
          <GlassCard class="player-card" :class="{ active: currentPlayerIndex === idx }">
            <div class="player-header">
              <span class="player-avatar">{{ player.avatar }}</span>
              <span class="player-name">{{ player.name }}</span>
              <span v-if="player.isAI" class="ai-badge">🤖</span>
              <span v-if="player.eliminated" class="eliminated-badge">已淘汰</span>
            </div>
            <div class="player-dice">
              <div 
                v-for="(die, i) in player.dice" 
                :key="i"
                class="die"
                :class="{ shaking: player.shaking && die.hidden }"
                @click="currentPlayerIndex === idx && player.id === userId && toggleDie(i)"
              >
                <div v-if="die.hidden" class="die-back">?</div>
                <div v-else class="die-front" :class="`face-${die.value}`">
                  {{ die.value }}
                </div>
              </div>
            </div>
            <p class="dice-count">剩余 {{ player.dice.filter(d => !d.hidden).length }} 颗骰子</p>
          </GlassCard>
        </div>
      </div>

      <!-- 游戏操作 -->
      <div v-if="!gameEnded" class="action-section">
        <div class="action-btns" v-if="currentPlayer.id === userId">
          <div class="bid-input">
            <label>喊注</label>
            <div class="input-group">
              <input type="number" v-model.number="bidCount" min="1" :max="totalDice" />
              <span>个</span>
              <select v-model.number="bidFace">
                <option v-for="f in 6" :key="f" :value="f">{{ f }} 点</option>
              </select>
            </div>
            <button class="action-btn bid-btn" @click="makeBid">喊注</button>
          </div>
          <button class="action-btn challenge-btn" @click="challenge" :disabled="currentBid.count === 0">
            开!
          </button>
        </div>
        <p v-else class="ai-thinking">{{ currentPlayer.name }} 思考中...</p>
      </div>

      <!-- 游戏结束 -->
      <div v-if="gameEnded" class="result-section">
        <GlassCard class="result-card">
          <h2>🎉 游戏结束</h2>
          <p class="winner-text">
            获胜者: <strong>{{ winner?.avatar }} {{ winner?.name }}</strong>
          </p>
          <button class="restart-btn" @click="resetGame">再来一局</button>
        </GlassCard>
      </div>

      <!-- 游戏记录 -->
      <div class="history-section">
        <h3>喊注历史</h3>
        <div class="bid-history">
          <span v-for="(bid, i) in bidHistory" :key="i" class="history-item">
            {{ bid.player }}: {{ bid.count }}个{{ bid.face }}
          </span>
          <span v-if="bidHistory.length === 0" class="no-history">暂无</span>
        </div>
      </div>
    </div>
    </template>

    <!-- 幸运转盘 -->
    <template v-if="gameTab === 'wheel'">
      <div class="wheel-section">
        <GlassCard class="wheel-card">
          <div class="wheel-header">
            <h2>🎡 幸运大转盘</h2>
            <div class="user-points">
              <span class="points-label">当前积分:</span>
              <span class="points-value">{{ userPoints }}</span>
            </div>
          </div>

          <div class="wheel-container">
            <div class="wheel" :class="{ spinning: isSpinning }">
              <div 
                v-for="(prize, idx) in prizes" 
                :key="idx" 
                class="prize-item"
                :style="{ transform: `rotate(${idx * 45}deg)` }"
              >
                <span class="prize-icon">{{ prize.icon }}</span>
                <span class="prize-name">{{ prize.name }}</span>
              </div>
              <div class="wheel-center" @click="spinWheel" :disabled="isSpinning || userPoints < spinCost">
                <span class="spin-text">{{ isSpinning ? '抽奖中...' : '开始' }}</span>
                <span class="spin-cost">消耗 {{ spinCost }} 积分</span>
              </div>
            </div>
            <div class="wheel-pointer">▼</div>
          </div>

          <div class="wheel-history">
            <h3>我的获奖记录</h3>
            <div class="history-list">
              <div v-for="(record, idx) in spinHistory" :key="idx" class="history-item">
                <span class="record-prize">{{ record.prize }}</span>
                <span class="record-time">{{ record.time }}</span>
              </div>
              <p v-if="spinHistory.length === 0" class="no-history">暂无记录</p>
            </div>
          </div>

          <div class="prizes-list">
            <h3>奖品列表</h3>
            <div class="prize-grid">
              <div v-for="prize in prizes" :key="prize.id" class="prize-card">
                <span class="prize-icon">{{ prize.icon }}</span>
                <span class="prize-name">{{ prize.name }}</span>
                <span class="prize-rate">{{ prize.rate }}%</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import { useAccessControl } from '@/composables/useAccessControl'
import { useUserStore } from '@/stores/user'

const { isLoggedIn, requireLogin } = useAccessControl()
const userStore = useUserStore()

const gameTab = ref('liar')

const handleGameTabClick = (tab) => {
  if (!requireLogin('登录后即可畅玩所有游戏')) return
  gameTab.value = tab
}
const playerCount = ref(2)
const aiLevel = ref('normal')
const gameStarted = ref(false)
const gameEnded = ref(false)
const currentPlayerIndex = ref(0)
const winnerId = ref(null)
const bidCount = ref(1)
const bidFace = ref(1)
const userId = 1

const avatars = ['😎', '🤔', '😇', '🧐', '🤓', '😸']
const playerNames = ['你', 'AI-张三', 'AI-李四', 'AI-王五']

const players = ref([])
const currentBid = ref({ count: 0, face: 1, player: '' })
const bidHistory = ref([])
const totalDice = computed(() => players.value.reduce((sum, p) => sum + p.dice.filter(d => !d.hidden).length, 0))

const currentPlayer = computed(() => players.value[currentPlayerIndex.value] || {})

const userPoints = computed(() => userStore.user?.points || 0)
const spinCost = ref(50)
const isSpinning = ref(false)
const spinHistory = ref([])
const wheelRotation = ref(0)

const prizes = ref([
  { id: 1, name: '积分+100', icon: '💯', rate: 30 },
  { id: 2, name: '积分+50', icon: '💰', rate: 25 },
  { id: 3, name: '谢谢参与', icon: '😢', rate: 20 },
  { id: 4, name: '积分+200', icon: '🎖️', rate: 15 },
  { id: 5, name: '优惠券', icon: '🎫', rate: 5 },
  { id: 6, name: '神秘大奖', icon: '🎁', rate: 3 },
  { id: 7, name: '积分+30', icon: '🪙', rate: 1 },
  { id: 8, name: '再来一次', icon: '🔄', rate: 1 },
])

const addGamePoints = (pts) => {
  userStore.addPoints(pts)
}

const spinWheel = async () => {
  if (isSpinning.value || !userStore.user || userPoints.value < spinCost.value) return
  
  addGamePoints(-spinCost.value)
  isSpinning.value = true
  
  const randomDegree = 1800 + Math.random() * 360
  wheelRotation.value += randomDegree
  
  setTimeout(() => {
    const finalDegree = wheelRotation.value % 360
    const prizeIndex = Math.floor((360 - finalDegree + 22.5) / 45) % 8
    const prize = prizes.value[prizeIndex]
    
    if (prize.name === '积分+100') addGamePoints(100)
    if (prize.name === '积分+50') addGamePoints(50)
    if (prize.name === '积分+200') addGamePoints(200)
    if (prize.name === '积分+30') addGamePoints(30)
    
    spinHistory.value.unshift({
      prize: prize.name,
      icon: prize.icon,
      time: new Date().toLocaleTimeString()
    })
    
    isSpinning.value = false
  }, 4000)
}
const winner = computed(() => players.value.find(p => p.id === winnerId.value))

const toggleDie = (idx) => {
  const player = players.value.find(p => p.id === userId)
  if (player && player.dice[idx]) {
    player.dice[idx].hidden = !player.dice[idx].hidden
  }
}

const rollDice = () => {
  const dice = []
  for (let i = 0; i < 5; i++) {
    dice.push({ value: Math.floor(Math.random() * 6) + 1, hidden: true })
  }
  return dice
}

const startGame = () => {
  players.value = [
    { id: userId, name: '你', avatar: '😎', isAI: false, dice: rollDice(), eliminated: false, shaking: false }
  ]
  for (let i = 1; i < playerCount.value; i++) {
    players.value.push({
      id: i + 1,
      name: playerNames[i] || `AI-${i}`,
      avatar: avatars[i] || '🤖',
      isAI: true,
      dice: rollDice(),
      eliminated: false,
      shaking: false
    })
  }
  currentBid.value = { count: 0, face: 1, player: '' }
  bidHistory.value = []
  currentPlayerIndex.value = 0
  winnerId.value = null
  gameStarted.value = true
  gameEnded.value = false
}

const makeBid = () => {
  if (bidCount.value < 1) return
  const validFace = currentBid.value.count === 0 ? 1 : currentBid.value.face
  if (currentBid.value.count > 0 && (bidCount.value < currentBid.value.count || (bidCount.value === currentBid.value.count && bidFace.value <= currentBid.value.face))) {
    alert('喊注必须大于上一个!')
    return
  }
  currentBid.value = { count: bidCount.value, face: bidFace.value, player: currentPlayer.value.name }
  bidHistory.value.push({
    player: currentPlayer.value.name,
    count: bidCount.value,
    face: bidFace.value
  })
  nextPlayer()
}

const challenge = () => {
  if (currentBid.value.count === 0) {
    alert('还没有人喊注!')
    return
  }
  const targetPlayerIndex = (currentPlayerIndex.value - 1 + players.value.length) % players.value.length
  const targetPlayer = players.value[targetPlayerIndex]
  
  let actualCount = 0
  players.value.forEach(p => {
    p.dice.forEach(d => {
      if (!d.hidden && d.value === currentBid.value.face) actualCount++
    })
  })

  if (actualCount >= currentBid.value.count) {
    alert(`😂 谎言戳破! 实际有 ${actualCount} 个 ${currentBid.value.face}，${targetPlayer.name} 喊对了!`)
    players.value[currentPlayerIndex.value].eliminated = true
  } else {
    alert(`🎯 开! 实际只有 ${actualCount} 个 ${currentBid.value.face}，${targetPlayer.name} 输了!`)
    targetPlayer.eliminated = true
  }

  checkWinner()
  if (!gameEnded.value) {
    currentBid.value = { count: 0, face: 1, player: '' }
    findNextAlivePlayer()
  }
}

const checkWinner = () => {
  const alive = players.value.filter(p => !p.eliminated)
  if (alive.length === 1) {
    winnerId.value = alive[0].id
    gameEnded.value = true
  } else if (alive.length === 0) {
    gameEnded.value = true
  }
}

const findNextAlivePlayer = () => {
  let idx = currentPlayerIndex.value
  for (let i = 0; i < players.value.length; i++) {
    const nextIdx = (idx + 1 + i) % players.value.length
    if (!players.value[nextIdx].eliminated) {
      currentPlayerIndex.value = nextIdx
      if (players.value[nextIdx].isAI) {
        setTimeout(aiPlay, 1500)
      }
      return
    }
  }
}

const nextPlayer = () => {
  findNextAlivePlayer()
}

const aiPlay = () => {
  if (gameEnded.value) return
  const ai = players.value[currentPlayerIndex.value]
  ai.shaking = true
  setTimeout(() => { ai.shaking = false }, 500)

  if (currentBid.value.count === 0) {
    const alive = players.value.filter(p => !p.eliminated).length
    const baseCount = Math.floor(Math.random() * 3) + 1
    bidCount.value = Math.min(baseCount, alive)
    bidFace.value = Math.floor(Math.random() * 6) + 1
    makeBid()
    return
  }

  const rand = Math.random()
  const challengeThreshold = aiLevel.value === 'easy' ? 0.3 : aiLevel.value === 'normal' ? 0.2 : 0.1

  if (rand < challengeThreshold) {
    challenge()
    return
  }

  const currentCount = currentBid.value.count
  const currentFace = currentBid.value.face
  const canIncreaseCount = currentCount < totalDice.value
  
  if (canIncreaseCount) {
    if (Math.random() > 0.5) {
      bidCount.value = currentCount + 1
      bidFace.value = Math.floor(Math.random() * 6) + 1
    } else {
      bidCount.value = currentCount
      bidFace.value = currentFace + 1
    }
  } else {
    bidCount.value = currentCount
    bidFace.value = Math.min(currentFace + 1, 6)
  }
  makeBid()
}

const resetGame = () => {
  gameStarted.value = false
  gameEnded.value = false
}
</script>

<style scoped>
.game-page {
  padding: 32px;
  color: var(--text-primary);
  min-height: 100%;
}

.game-header {
  text-align: center;
  margin-bottom: 32px;
}

.game-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.start-section {
  max-width: 400px;
  margin: 0 auto;
}

.start-card {
  text-align: center;
}

.start-card h2 {
  font-size: 20px;
  margin-bottom: 24px;
}

.setting-row {
  margin-bottom: 20px;
}

.setting-row label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
}

.player-btns {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.player-btns button {
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.player-btns button.active,
.player-btns button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

.start-btn {
  margin-top: 24px;
  padding: 12px 40px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.game-board {
  max-width: 900px;
  margin: 0 auto;
}

.current-bid-card {
  margin-bottom: 24px;
  text-align: center;
}

.bid-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.bid-player {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-icon {
  font-size: 24px;
}

.player-name {
  font-size: 16px;
  font-weight: 600;
}

.player-label {
  font-size: 12px;
  color: #ffd700;
}

.bid-content {
  font-size: 18px;
}

.bid-count, .bid-face {
  color: #ffd700;
  font-size: 24px;
}

.no-bid {
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 8px;
}

.players-area {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.player-card {
  text-align: center;
}

.player-card.active {
  border-color: #667eea;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.player-card.winner {
  border-color: #ffd700;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.player-avatar {
  font-size: 28px;
}

.ai-badge {
  font-size: 14px;
}

.eliminated-badge {
  font-size: 12px;
  color: #ff6b6b;
}

.player-dice {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.die {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.die:hover {
  transform: scale(1.1);
}

.die-back {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2d3748, #1a202c);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 20px;
}

.die-front {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fff, #e2e8f0);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
}

.die-front.face-1 { background: linear-gradient(135deg, #ffeaaa, #ffd700); }
.die-front.face-2 { background: linear-gradient(135deg, #90cdf4, #4299e1); }
.die-front.face-3 { background: linear-gradient(135deg, #9ae6b4, #48bb78); }
.die-front.face-4 { background: linear-gradient(135deg, #fbb6ce, #ed64a6); }
.die-front.face-5 { background: linear-gradient(135deg, #c3dafe, #667eea); }
.die-front.face-6 { background: linear-gradient(135deg, #fbd38d, #ed8936); }

.die.shaking {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
}

.dice-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.action-section {
  margin-bottom: 24px;
  text-align: center;
}

.action-btns {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: flex-end;
  flex-wrap: wrap;
}

.bid-input {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.bid-input label {
  font-size: 14px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-group input,
.input-group select {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  font-size: 14px;
}

.input-group input {
  width: 60px;
}

.action-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.bid-btn {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: #fff;
}

.bid-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(72, 187, 120, 0.4);
}

.challenge-btn {
  background: linear-gradient(135deg, #ff6b6b, #e53e3e);
  color: #fff;
  font-size: 18px;
}

.challenge-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4);
}

.challenge-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-thinking {
  color: var(--text-secondary);
  font-size: 14px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.result-section {
  text-align: center;
  margin-bottom: 24px;
}

.result-card h2 {
  font-size: 24px;
  margin-bottom: 16px;
}

.winner-text {
  font-size: 20px;
  margin-bottom: 20px;
}

.winner-text strong {
  color: #ffd700;
  font-size: 28px;
}

.restart-btn {
  padding: 12px 40px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a202c;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.restart-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
}

.history-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.history-section h3 {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--text-secondary);
}

.bid-history {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-item {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  font-size: 12px;
}

.no-history {
  color: var(--text-muted);
  font-size: 14px;
}

/* 游戏切换标签 */
.game-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  justify-content: center;
}

.game-tabs button {
  padding: 14px 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.game-tabs button.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.game-tabs button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
}

/* 幸运转盘 */
.wheel-section {
  max-width: 800px;
  margin: 0 auto;
}

.wheel-card {
  padding: 32px !important;
}

.wheel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.wheel-header h2 {
  font-size: 24px;
}

.user-points {
  display: flex;
  align-items: center;
  gap: 12px;
}

.points-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.points-value {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
}

.wheel-container {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto 32px;
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  position: relative;
  transition: transform 4s cubic-bezier(0.2, 0.8, 0.3, 1);
  overflow: hidden;
}

.wheel.spinning {
  transform: rotate(3600deg);
}

.prize-item {
  position: absolute;
  width: 50%;
  height: 50%;
  left: 50%;
  top: 0;
  transform-origin: 0% 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 20px;
}

.prize-icon {
  font-size: 24px;
}

.prize-name {
  font-size: 10px;
  color: #fff;
  text-align: center;
}

.wheel-center {
  position: absolute;
  width: 80px;
  height: 80px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
  transition: all 0.3s;
}

.wheel-center:hover:not([disabled]) {
  transform: translate(-50%, -50%) scale(1.1);
}

.wheel-center[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-text {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.spin-cost {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.7);
}

.wheel-pointer {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  color: #ffd700;
}

.wheel-history {
  margin-bottom: 32px;
}

.wheel-history h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-list .history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.record-prize {
  font-size: 14px;
}

.record-time {
  font-size: 12px;
  color: var(--text-muted);
}

.prizes-list h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.prize-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.prize-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.prize-card .prize-icon {
  font-size: 28px;
}

.prize-card .prize-name {
  font-size: 13px;
}

.prize-rate {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 未登录遮罩 */
.game-page.guest-mode {
  position: relative;
}

.guest-block-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 14px;
}

.guest-block-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 600;
}

.guest-lock-icon {
  font-size: 40px;
}
</style>