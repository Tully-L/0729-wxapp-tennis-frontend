const mongoose = require('mongoose');

// 盘（Set）模式
const setSchema = new mongoose.Schema({
  // 关联信息
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  setNumber: {
    type: Number,
    required: true,
    min: 1
  },
  
  // 盘的状态
  status: {
    type: String,
    required: true,
    enum: ['未开始', '进行中', '已结束'],
    default: '未开始'
  },
  
  // 盘的比分
  score: {
    team1: {
      type: Number,
      required: true,
      default: 0
    },
    team2: {
      type: Number,
      required: true,
      default: 0
    }
  },
  
  // 抢七局信息
  tiebreak: {
    played: {
      type: Boolean,
      default: false
    },
    score: {
      team1: {
        type: Number,
        default: 0
      },
      team2: {
        type: Number,
        default: 0
      }
    },
    winner: {
      type: String,
      enum: ['team1', 'team2', null],
      default: null
    }
  },
  
  // 盘的获胜者
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
    type: String, // 格式: "45m"
    default: null
  },
  
  // 统计信息
  totalGames: {
    type: Number,
    default: 0
  },
  serviceGames: {
    team1: {
      type: Number,
      default: 0
    },
    team2: {
      type: Number,
      default: 0
    }
  },
  breakPoints: {
    team1: {
      opportunities: { type: Number, default: 0 },
      converted: { type: Number, default: 0 }
    },
    team2: {
      opportunities: { type: Number, default: 0 },
      converted: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// 索引
setSchema.index({ matchId: 1, setNumber: 1 }, { unique: true });
setSchema.index({ status: 1 });

// 虚拟字段：获取盘比分字符串
setSchema.virtual('scoreString').get(function() {
  let scoreStr = `${this.score.team1}-${this.score.team2}`;
  
  if (this.tiebreak.played) {
    const tieScore = this.tiebreak.winner === 'team1' ? 
      this.tiebreak.score.team1 : this.tiebreak.score.team2;
    scoreStr += `(${tieScore})`;
  }
  
  return scoreStr;
});

// 方法：检查是否需要抢七
setSchema.methods.needsTiebreak = function() {
  return this.score.team1 === 6 && this.score.team2 === 6;
};

// 方法：检查盘是否结束
setSchema.methods.isSetComplete = function() {
  const score1 = this.score.team1;
  const score2 = this.score.team2;
  
  // 正常情况：6-4, 6-3, 6-2, 6-1, 6-0
  if ((score1 >= 6 || score2 >= 6) && Math.abs(score1 - score2) >= 2) {
    return true;
  }
  
  // 7-5 情况
  if ((score1 === 7 && score2 === 5) || (score1 === 5 && score2 === 7)) {
    return true;
  }
  
  // 抢七结束
  if (this.tiebreak.played && this.tiebreak.winner) {
    return true;
  }
  
  return false;
};

// 方法：开始盘
setSchema.methods.startSet = function() {
  this.status = '进行中';
  this.startTime = new Date();
  return this.save();
};

// 方法：结束盘
setSchema.methods.endSet = function() {
  this.status = '已结束';
  this.endTime = new Date();
  
  // 确定获胜者
  if (this.tiebreak.played) {
    this.winner = this.tiebreak.winner;
  } else {
    this.winner = this.score.team1 > this.score.team2 ? 'team1' : 'team2';
  }
  
  // 计算持续时间
  if (this.startTime && this.endTime) {
    const duration = Math.floor((this.endTime - this.startTime) / 1000 / 60);
    this.duration = `${duration}m`;
  }
  
  // 计算总局数
  this.totalGames = this.score.team1 + this.score.team2;
  
  return this.save();
};

module.exports = mongoose.model('Set', setSchema);