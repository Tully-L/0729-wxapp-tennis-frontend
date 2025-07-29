// 锦标赛管理工具类
const { API } = require('./api');

class TournamentManager {
  constructor() {
    this.tournaments = new Map();
    this.brackets = new Map();
    
    console.log('🏆 锦标赛管理器初始化完成');
  }

  // 创建锦标赛
  async createTournament(tournamentData) {
    try {
      const {
        name,
        eventType,
        maxParticipants,
        startDate,
        venue,
        registrationDeadline,
        format, // 'single_elimination', 'double_elimination', 'round_robin'
        description
      } = tournamentData;

      // 验证参数
      if (!name || !eventType || !maxParticipants) {
        throw new Error('缺少必要参数');
      }

      // 验证参与者数量（必须是2的幂次方用于单淘汰赛）
      if (format === 'single_elimination' && !this.isPowerOfTwo(maxParticipants)) {
        throw new Error('单淘汰赛参与者数量必须是2的幂次方');
      }

      const tournament = {
        name,
        eventType,
        maxParticipants,
        startDate,
        venue,
        registrationDeadline,
        format,
        description,
        status: 'registration',
        participants: [],
        bracket: null,
        createdAt: new Date().toISOString()
      };

      // 调用API创建锦标赛
      const response = await API.createTournament(tournament);
      
      if (response.success) {
        this.tournaments.set(response.data._id, response.data);
        return response.data;
      } else {
        throw new Error(response.message || '创建锦标赛失败');
      }
    } catch (error) {
      console.error('创建锦标赛失败:', error);
      throw error;
    }
  }

  // 生成对阵表
  generateBracket(tournamentId, participants) {
    try {
      const tournament = this.tournaments.get(tournamentId);
      if (!tournament) {
        throw new Error('锦标赛不存在');
      }

      let bracket;
      switch (tournament.format) {
        case 'single_elimination':
          bracket = this.generateSingleEliminationBracket(participants);
          break;
        case 'double_elimination':
          bracket = this.generateDoubleEliminationBracket(participants);
          break;
        case 'round_robin':
          bracket = this.generateRoundRobinBracket(participants);
          break;
        default:
          throw new Error('不支持的锦标赛格式');
      }

      this.brackets.set(tournamentId, bracket);
      tournament.bracket = bracket;
      
      return bracket;
    } catch (error) {
      console.error('生成对阵表失败:', error);
      throw error;
    }
  }

  // 生成单淘汰赛对阵表
  generateSingleEliminationBracket(participants) {
    const rounds = [];
    let currentRound = [...participants];
    let roundNumber = 1;

    // 随机打乱参与者顺序
    currentRound = this.shuffleArray(currentRound);

    while (currentRound.length > 1) {
      const matches = [];
      const nextRound = [];

      // 创建本轮比赛
      for (let i = 0; i < currentRound.length; i += 2) {
        const player1 = currentRound[i];
        const player2 = currentRound[i + 1] || null; // 处理奇数参与者

        const match = {
          id: `R${roundNumber}M${Math.floor(i / 2) + 1}`,
          round: roundNumber,
          player1: player1,
          player2: player2,
          winner: null,
          score: { player1: 0, player2: 0 },
          status: 'scheduled',
          scheduledTime: null
        };

        matches.push(match);

        // 如果没有对手，直接晋级
        if (!player2) {
          nextRound.push(player1);
        } else {
          // 占位符，等待比赛结果
          nextRound.push(null);
        }
      }

      rounds.push({
        round: roundNumber,
        name: this.getRoundName(roundNumber, participants.length),
        matches: matches
      });

      currentRound = nextRound;
      roundNumber++;
    }

    return {
      type: 'single_elimination',
      rounds: rounds,
      totalRounds: rounds.length,
      champion: null
    };
  }

  // 生成双淘汰赛对阵表
  generateDoubleEliminationBracket(participants) {
    // 双淘汰赛包含胜者组和败者组
    const winnersBracket = this.generateSingleEliminationBracket(participants);
    const losersBracket = this.generateLosersBracket(participants.length);

    return {
      type: 'double_elimination',
      winnersBracket: winnersBracket,
      losersBracket: losersBracket,
      grandFinal: null,
      champion: null
    };
  }

  // 生成循环赛对阵表
  generateRoundRobinBracket(participants) {
    const matches = [];
    let matchId = 1;

    // 每个参与者与其他所有参与者比赛
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const match = {
          id: `RR${matchId}`,
          round: 1, // 循环赛只有一轮
          player1: participants[i],
          player2: participants[j],
          winner: null,
          score: { player1: 0, player2: 0 },
          status: 'scheduled',
          scheduledTime: null
        };

        matches.push(match);
        matchId++;
      }
    }

    return {
      type: 'round_robin',
      rounds: [{
        round: 1,
        name: '循环赛',
        matches: matches
      }],
      standings: this.initializeStandings(participants)
    };
  }

  // 更新比赛结果
  updateMatchResult(tournamentId, matchId, result) {
    try {
      const bracket = this.brackets.get(tournamentId);
      if (!bracket) {
        throw new Error('对阵表不存在');
      }

      const match = this.findMatch(bracket, matchId);
      if (!match) {
        throw new Error('比赛不存在');
      }

      // 更新比赛结果
      match.score = result.score;
      match.winner = result.winner;
      match.status = 'completed';
      match.completedAt = new Date().toISOString();

      // 根据锦标赛格式处理晋级
      switch (bracket.type) {
        case 'single_elimination':
          this.advanceWinnerSingleElimination(bracket, match);
          break;
        case 'double_elimination':
          this.advanceWinnerDoubleElimination(bracket, match);
          break;
        case 'round_robin':
          this.updateRoundRobinStandings(bracket, match);
          break;
      }

      return bracket;
    } catch (error) {
      console.error('更新比赛结果失败:', error);
      throw error;
    }
  }

  // 单淘汰赛晋级处理
  advanceWinnerSingleElimination(bracket, completedMatch) {
    const nextRoundNumber = completedMatch.round + 1;
    const nextRound = bracket.rounds.find(r => r.round === nextRoundNumber);
    
    if (!nextRound) {
      // 这是决赛，设置冠军
      bracket.champion = completedMatch.winner;
      return;
    }

    // 找到下一轮对应的比赛
    const matchIndex = Math.floor(
      bracket.rounds.find(r => r.round === completedMatch.round)
        .matches.indexOf(completedMatch) / 2
    );
    
    const nextMatch = nextRound.matches[matchIndex];
    
    // 确定获胜者应该放在player1还是player2位置
    const isFirstMatch = bracket.rounds.find(r => r.round === completedMatch.round)
      .matches.indexOf(completedMatch) % 2 === 0;
    
    if (isFirstMatch) {
      nextMatch.player1 = completedMatch.winner;
    } else {
      nextMatch.player2 = completedMatch.winner;
    }
  }

  // 循环赛积分更新
  updateRoundRobinStandings(bracket, completedMatch) {
    const standings = bracket.standings;
    const winner = completedMatch.winner;
    const loser = completedMatch.player1 === winner ? completedMatch.player2 : completedMatch.player1;

    // 更新获胜者积分
    const winnerStanding = standings.find(s => s.player.id === winner.id);
    if (winnerStanding) {
      winnerStanding.wins++;
      winnerStanding.points += 3; // 胜利得3分
    }

    // 更新失败者积分
    const loserStanding = standings.find(s => s.player.id === loser.id);
    if (loserStanding) {
      loserStanding.losses++;
    }

    // 重新排序积分榜
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    });
  }

  // 工具方法
  isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getRoundName(roundNumber, totalParticipants) {
    const totalRounds = Math.log2(totalParticipants);
    const remainingRounds = totalRounds - roundNumber + 1;

    switch (remainingRounds) {
      case 1: return '决赛';
      case 2: return '半决赛';
      case 3: return '四分之一决赛';
      case 4: return '八分之一决赛';
      default: return `第${roundNumber}轮`;
    }
  }

  findMatch(bracket, matchId) {
    for (const round of bracket.rounds) {
      const match = round.matches.find(m => m.id === matchId);
      if (match) return match;
    }
    return null;
  }

  initializeStandings(participants) {
    return participants.map(player => ({
      player: player,
      wins: 0,
      losses: 0,
      points: 0,
      rank: 0
    }));
  }

  // 获取锦标赛状态
  getTournamentStatus(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return null;

    const bracket = this.brackets.get(tournamentId);
    if (!bracket) return { ...tournament, progress: 0 };

    // 计算进度
    let totalMatches = 0;
    let completedMatches = 0;

    bracket.rounds.forEach(round => {
      totalMatches += round.matches.length;
      completedMatches += round.matches.filter(m => m.status === 'completed').length;
    });

    const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    return {
      ...tournament,
      bracket,
      progress: Math.round(progress),
      totalMatches,
      completedMatches
    };
  }

  // 获取下一场比赛
  getNextMatches(tournamentId, limit = 5) {
    const bracket = this.brackets.get(tournamentId);
    if (!bracket) return [];

    const nextMatches = [];
    
    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        if (match.status === 'scheduled' && match.player1 && match.player2) {
          nextMatches.push(match);
          if (nextMatches.length >= limit) break;
        }
      }
      if (nextMatches.length >= limit) break;
    }

    return nextMatches;
  }
}

// 创建全局锦标赛管理器实例
let tournamentManager = null;

function getTournamentManager() {
  if (!tournamentManager) {
    tournamentManager = new TournamentManager();
  }
  return tournamentManager;
}

module.exports = {
  TournamentManager,
  getTournamentManager
};