const mongoose = require('mongoose');

// 局（Game）模式
const gameSchema = new mongoose.Schema({
  // 关联信息
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  setId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Set',
    required: true
  },
  gameNumber: {
    type: Number,
    required: true,
    min: 1
  },
  
  // 局的状态
  status: {
    type: String,
    required: true,
    enum: ['未开始', '进行中', '已结束'],
    default: '未开始'
  },
  
  // 发球方
  server: {
    type: String,
    required: true,
    enum: ['team1', 'team2']
  },
  
  // 局的比分（网球计分：0, 15, 30, 40, deuce, advantage）
  score: {
    team1: {
      type: String,
      required: true,
      default: '0',
      enum: ['0', '15', '30', '40', 'deuce', 'advantage']
    },
    team2: {
      type: String,
      required: true,
      default: '0',
      enum: ['0', '15', '30', '40', 'deuce', 'advantage']
    }
  },
  
  // 局的获胜者
  winner: {
    type: String,
    enum: ['team1', 'team2', null],
    default: null
  },
  
  // 时间信息
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: String, // 格式: "3m"
    default: null
  },
  
  // 得分详情
  points: [{
    pointNumber: Number,
    winner: {
      type: String,
      enum: ['team1', 'team2']
    },
    type: {
      type: String,
      enum: ['ace', 'winner', 'forced_error', 'unforced_error', 'double_fault'],
      default: 'winner'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 统计信息
  totalPoints: {
    type: Number,
    default: 0
  },
  aces: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  doubleFaults: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  winners: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  unforcedErrors: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 }
  },
  
  // 是否为破发局
  isBreakPoint: {
    type: Boolean,
    default: false
  },
  breakPointsSaved: {
    type: Number,
    default: 0
  },
  breakPointsConverted: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 索引
gameSchema.index({ matchId: 1, setId: 1, gameNumber: 1 }, { unique: true });
gameSchema.index({ status: 1 });
gameSchema.index({ server: 1 });

// 虚拟字段：获取局比分字符串
gameSchema.virtual('scoreString').get(function() {
  return `${this.score.team1}-${this.score.team2}`;
});

// 方法：检查是否为破发点
gameSchema.methods.isBreakPointSituation = function() {
  const serverTeam = this.server;
  const receiverTeam = serverTeam === 'team1' ? 'team2' : 'team1';
  
  // 接发球方领先且有机会赢得这一局
  if (this.score[receiverTeam] === '40' && this.score[serverTeam] !== '40') {
    return true;
  }
  
  // 平分后接发球方占优
  if (this.score[receiverTeam] === 'advantage') {
    return true;
  }
  
  return false;
};

// 方法：添加得分
gameSchema.methods.addPoint = function(winner, pointType = 'winner') {
  const loser = winner === 'team1' ? 'team2' : 'team1';
  
  // 记录得分详情
  this.points.push({
    pointNumber: this.points.length + 1,
    winner: winner,
    type: pointType,
    timestamp: new Date()
  });
  
  // 更新统计
  this.totalPoints++;
  if (pointType === 'ace') {
    this.aces[winner]++;
  } else if (pointType === 'double_fault') {
    this.doubleFaults[loser]++;
  } else if (pointType === 'winner') {
    this.winners[winner]++;
  } else if (pointType === 'unforced_error') {
    this.unforcedErrors[loser]++;
  }
  
  // 更新比分
  this.updateScore(winner);
  
  return this.save();
};

// 方法：更新比分
gameSchema.methods.updateScore = function(winner) {
  const loser = winner === 'team1' ? 'team2' : 'team1';
  const winnerScore = this.score[winner];
  const loserScore = this.score[loser];
  
  // 处理平分情况
  if (winnerScore === 'deuce' || loserScore === 'deuce') {
    if (winnerScore === 'advantage') {
      // 获胜者在占优情况下得分，赢得这一局
      this.winner = winner;
      this.endGame();
      return;
    } else if (loserScore === 'advantage') {
      // 回到平分
      this.score[winner] = 'deuce';
      this.score[loser] = 'deuce';
      return;
    } else if (winnerScore === 'deuce' && loserScore === 'deuce') {
      // 平分情况下得分，获得优势
      this.score[winner] = 'advantage';
      return;
    }
  }
  
  // 正常计分
  const scoreProgression = ['0', '15', '30', '40'];
  const currentIndex = scoreProgression.indexOf(winnerScore);
  
  if (currentIndex < 3) {
    this.score[winner] = scoreProgression[currentIndex + 1];
  } else if (winnerScore === '40') {
    if (loserScore === '40') {
      // 进入平分
      this.score[winner] = 'deuce';
      this.score[loser] = 'deuce';
    } else {
      // 赢得这一局
      this.winner = winner;
      this.endGame();
    }
  }
};

// 方法：开始局
gameSchema.methods.startGame = function() {
  this.status = '进行中';
  this.startTime = new Date();
  return this.save();
};

// 方法：结束局
gameSchema.methods.endGame = function() {
  this.status = '已结束';
  this.endTime = new Date();
  
  // 计算持续时间
  if (this.startTime && this.endTime) {
    const duration = Math.floor((this.endTime - this.startTime) / 1000 / 60);
    this.duration = `${duration}m`;
  }
  
  return this.save();
};

module.exports = mongoose.model('Game', gameSchema);