export type Language = 'zh' | 'en';

export const translations = {
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      noData: 'No data available',
      error: 'An error occurred',
      success: 'Success',
    },
    app: {
      title: 'Charlie FocusLab',
      subtitle: 'Professional Cognitive Training & Assessment Platform',
      dashboard: 'Dashboard',
      games: 'Training',
      analytics: 'Analytics',
      history: 'History',
      leaderboard: 'Leaderboard',
      admin: 'Admin',
      signOut: 'Sign Out',
      user: 'User',
      startSession: 'Start Session',
      importData: 'Import Data File (JSON)',
      dataMgmt: 'Data Management',
      footer: 'Research Grade • Cloud Sync • Multi-device',
      usernamePlaceholder: 'Enter your name',
      usernameLabel: 'Username',
      backToGames: 'Back to Training',
      tryAgain: 'Try Again',
      viewDashboard: 'View Dashboard',
      sessionComplete: 'Session Complete',
      greatJob: 'Great job! Here are your results.',
      instructions: 'Instructions',
      start: 'Start Session',
      exit: 'Exit',
      loading: 'Loading...',
      selectDifficulty: 'Select Difficulty',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      difficultyDesc: {
        easy: 'Recommended for beginners',
        medium: 'Standard challenge level',
        hard: 'For advanced users'
      }
    },
    games: {
      subtitle: 'Choose a task and difficulty level to begin training.',
      selectDifficulty: 'Select Difficulty',
      infoTitle: 'Training Tips',
      infoDesc: 'For best results, complete sessions in a quiet environment. Each difficulty level adjusts parameters to match your skill level.',
      schulte: {
        title: 'Schulte Grid',
        desc: 'Improve attention span and visual search speed.',
        cognitive: 'Visual Search · Attention Span',
        instructions: [
          "A grid with numbers will appear.",
          "Click the numbers in ascending order.",
          "Try to be as fast as possible while avoiding errors.",
          "Your reaction time for each click is recorded."
        ],
        difficultyParams: {
          easy: '4×4 grid, 16 numbers',
          medium: '5×5 grid, 25 numbers',
          hard: '6×6 grid, 36 numbers with distractors'
        }
      },
      memory: {
        title: 'Memory Cards',
        desc: 'Enhance working memory and visual retention.',
        cognitive: 'Working Memory · Visuospatial',
        instructions: [
          "A grid of cards will appear face down.",
          "Click to flip two cards at a time.",
          "If they match, they stay open.",
          "If not, they flip back. Remember their positions!",
          "Clear the board with as few moves as possible."
        ],
        difficultyParams: {
          easy: '3×4 grid, 6 pairs',
          medium: '4×4 grid, 8 pairs',
          hard: '5×4 grid, 10 pairs, shorter preview'
        }
      },
      gonogo: {
        title: 'Go/No-Go',
        desc: 'Train response inhibition and reaction speed.',
        cognitive: 'Inhibitory Control · Sustained Attention',
        instructions: [
          "A colored stimulus will appear.",
          "If it is GREEN, respond as fast as you can.",
          "If it is RED, do not respond.",
          "Speed is important, but accuracy is key."
        ],
        good: 'Correct',
        missed: 'Missed',
        dontClick: 'False Alarm',
        wait: 'Ready...',
        difficultyParams: {
          easy: '70% Go, 800ms window',
          medium: '60% Go, 600ms window',
          hard: '50% Go, 400ms window, variable ISI'
        }
      },
      stroop: {
        title: 'Stroop Test',
        desc: 'Measure cognitive control and interference processing.',
        cognitive: 'Cognitive Flexibility · Interference Control',
        instructions: [
          "A color word will appear in a specific ink color.",
          "Select the button matching the INK COLOR.",
          "Ignore what the word says!",
          "Example: 'RED' in blue ink → click 'Blue'."
        ],
        difficultyParams: {
          easy: '70% congruent, 4 colors',
          medium: '50% congruent, 4 colors',
          hard: '30% congruent, 6 colors'
        }
      }
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of your cognitive training progress.',
      totalGames: 'Total Sessions',
      avgScore: 'Avg Accuracy',
      trainingTime: 'Training Time',
      streak: 'Streak',
      recentTrend: 'Recent Performance Trend',
      cognitiveProfile: 'Cognitive Profile',
      avgScoreByGame: 'Performance by Task',
      exportJsonMe: 'Export JSON',
      exportJsonAll: 'Export All',
      exportCsv: 'Export CSV',
      insights: 'Insights',
      noInsights: 'Complete more sessions to see insights.',
      strengths: 'Strengths',
      areasToImprove: 'Areas to Improve',
      recommendations: 'Recommendations',
      avgAccuracy: 'Accuracy',
      avgRT: 'Avg RT',
      noData: 'No Training Data',
      startTraining: 'Complete some training sessions to see your performance data and insights here.'
    },
    nav: {
      games: 'Training',
      analytics: 'Analytics',
      history: 'History',
      admin: 'Admin',
      dashboard: 'Dashboard'
    },
    analytics: {
      title: 'Advanced Analytics',
      subtitle: 'Deep dive into reaction times, variability, and error patterns.',
      rtDist: 'Reaction Time Distribution',
      rtTrend: 'RT Trend (Last 100 Trials)',
      rtvTrend: 'Attention Stability (RTV Trend)',
      rtvDesc: 'Coefficient of Variation (CV) over sliding window. Lower is more stable.',
      errorTypes: 'Error Analysis',
      stroopEffect: 'Stroop Interference Effect',
      effectSize: 'Effect Size',
      filterByGame: 'Filter by Task',
      filterByDifficulty: 'Filter by Difficulty',
      filterByDate: 'Filter by Date',
      allGames: 'All Tasks',
      allDifficulties: 'All Difficulties',
      meanRT: 'Mean RT',
      medianRT: 'Median RT',
      sdRT: 'SD RT',
      cv: 'CV%',
      omissionErrors: 'Omission Errors',
      commissionErrors: 'Commission Errors',
      hitRate: 'Hit Rate',
      falseAlarmRate: 'False Alarm Rate',
      dPrime: "d' (Sensitivity)"
    },
    history: {
      title: 'Training History',
      subtitle: 'Detailed log of all your training sessions.',
      date: 'Date',
      game: 'Task',
      score: 'Score',
      time: 'Time',
      totalTime: 'Duration',
      performance: 'Performance',
      trialData: 'Trial Data',
      accuracy: 'Accuracy',
      meanRT: 'Mean RT',
      actions: 'Actions',
      details: 'Details',
      errors: 'Errors',
      sdRT: 'SD RT',
      trial: 'Trial',
      type: 'Type',
      response: 'Response',
      result: 'Result',
      difficulty: 'Difficulty',
      noHistory: 'No training history yet. Start a session to see your data here.'
    },
    admin: {
      title: 'Admin Panel',
      description: 'View and analyze all user training data.',
      totalUsers: 'Total Users',
      totalSessions: 'Total Sessions',
      completionRate: 'Completion Rate',
      userList: 'User List',
      userListDesc: 'Click to view detailed user data',
      exportAll: 'Export All',
      searchPlaceholder: 'Search users...',
      lastActive: 'Last Active',
      noUsers: 'No users found',
      userData: 'User Data',
      userSessions: 'User Sessions',
      exportUserData: 'Export User Data',
      backToList: 'Back to List',
      accessDenied: 'Access Denied',
      accessDeniedDesc: 'You do not have permission to access the admin panel. Only administrator accounts can access this page.'
    },
    leaderboard: {
      title: 'Leaderboard',
      description: 'See training rankings and compete with others',
      overall: 'Overall',
      game: 'By Game',
      participation: 'Participation',
      overallTitle: 'Overall Ability Ranking',
      overallDesc: 'Composite score based on reaction speed, accuracy and stability',
      gameTitle: 'Ranking',
      gameDesc: 'Ranked by best score',
      participationTitle: 'Participation Ranking',
      participationDesc: 'Ranked by training sessions',
      noData: 'No ranking data yet',
      you: 'You',
      sessions: 'sessions',
      times: 'times',
      accuracy: 'Accuracy',
      avgRt: 'Avg RT',
      stability: 'Stability',
      bestScore: 'Best Score',
      totalScore: 'Total Score',
      score: 'Score',
      trainingCount: 'Sessions',
      totalDuration: 'Total Duration',
      totalTrials: 'Total Trials',
      lastTraining: 'Last trained',
      minutes: 'min',
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      allTime: 'All Time',
    },
    insights: {
      attentionStability: 'Attention Stability',
      reactionSpeed: 'Reaction Speed',
      inhibitionControl: 'Inhibition Control',
      workingMemory: 'Working Memory',
      interferenceControl: 'Interference Control',
      high: 'High',
      moderate: 'Moderate',
      low: 'Low',
      improving: 'Improving',
      stable: 'Stable',
      declining: 'Declining',
      // Insight messages
      highRtvWarning: 'Your reaction time variability is high, suggesting attention fluctuations. Try shorter, more frequent sessions.',
      lowRtvGood: 'Your attention stability is excellent. Maintain this consistency.',
      highCommissionWarning: 'High false alarm rate indicates impulsivity. Practice the Go/No-Go task on harder difficulty.',
      highOmissionWarning: 'High miss rate suggests attention lapses. Consider taking breaks between sessions.',
      strongStroopEffect: 'Large Stroop effect indicates interference control needs work. Practice the Stroop task regularly.',
      goodInhibition: 'Your inhibition control is strong. Challenge yourself with harder difficulties.',
      fastReaction: 'Your reaction speed is above average. Focus on maintaining accuracy.',
      slowReaction: 'Your reaction time could improve. Consistent practice will help.',
      goodMemory: 'Your working memory performance is solid. Try increasing difficulty.',
      memoryNeedsWork: 'Working memory could use improvement. Practice the Memory Cards task.'
    },
    landing: {
      hero: {
        title: 'Train Your Mind,',
        titleHighlight: 'Measure Your Progress',
        subtitle: 'A research-grade cognitive training platform designed for scientific precision and actionable insights.',
        cta: 'Start Training',
        secondaryCta: 'Learn More'
      },
      features: {
        title: 'Built for Serious Training',
        scientific: {
          title: 'Scientific Rigor',
          desc: 'Tasks based on established cognitive psychology paradigms with millisecond-precision timing.'
        },
        insights: {
          title: 'Actionable Insights',
          desc: 'Understand your cognitive strengths and weaknesses with detailed analytics and personalized recommendations.'
        },
        cloud: {
          title: 'Cloud Sync',
          desc: 'Your data syncs across devices. Train anywhere, analyze everywhere.'
        },
        privacy: {
          title: 'Privacy First',
          desc: 'Your cognitive data is yours. Full control over data export and deletion.'
        }
      },
      tasks: {
        title: 'Four Core Training Tasks',
        subtitle: 'Each task targets specific cognitive abilities with adjustable difficulty levels.'
      }
    }
  },
  zh: {
    common: {
      loading: '加载中...',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      view: '查看',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      search: '搜索',
      filter: '筛选',
      export: '导出',
      import: '导入',
      noData: '暂无数据',
      error: '发生错误',
      success: '成功',
    },
    app: {
      title: 'Charlie FocusLab',
      subtitle: '专业认知训练与评估平台',
      dashboard: '首页',
      games: '训练项目',
      analytics: '数据分析',
      history: '历史记录',
      leaderboard: '排行榜',
      admin: '管理后台',
      signOut: '退出登录',
      user: '用户',
      startSession: '开始训练',
      importData: '导入数据文件 (JSON)',
      dataMgmt: '数据管理',
      footer: '科研级精度 • 云端同步 • 多设备支持',
      usernamePlaceholder: '输入您的姓名',
      usernameLabel: '用户名',
      backToGames: '返回训练列表',
      tryAgain: '再试一次',
      viewDashboard: '查看仪表板',
      sessionComplete: '训练完成',
      greatJob: '做得好！以下是您的训练结果。',
      instructions: '训练说明',
      start: '开始训练',
      exit: '退出',
      loading: '加载中...',
      selectDifficulty: '选择难度',
      easy: '简单',
      medium: '中等',
      hard: '困难',
      difficultyDesc: {
        easy: '推荐新手使用',
        medium: '标准挑战难度',
        hard: '适合进阶用户'
      }
    },
    games: {
      subtitle: '选择一个任务和难度级别开始训练。',
      selectDifficulty: '选择难度',
      infoTitle: '训练建议',
      infoDesc: '为了获得最佳效果，请在安静的环境中完成训练。每个难度级别会调整参数以匹配您的技能水平。',
      schulte: {
        title: '舒尔特方格',
        desc: '提升注意力广度和视觉搜索速度。',
        cognitive: '视觉搜索 · 注意广度',
        instructions: [
          "屏幕上会出现一个数字网格。",
          "请按升序点击数字。",
          "尽可能快地完成，同时避免出错。",
          "系统将记录您每次点击的反应时间。"
        ],
        difficultyParams: {
          easy: '4×4 网格，16个数字',
          medium: '5×5 网格，25个数字',
          hard: '6×6 网格，36个数字，含干扰项'
        }
      },
      memory: {
        title: '记忆翻牌',
        desc: '增强工作记忆和视觉保持能力。',
        cognitive: '工作记忆 · 视觉空间',
        instructions: [
          "屏幕上会出现卡片矩阵，背面朝上。",
          "每次点击翻开两张卡片。",
          "如果图案相同，卡片将保持翻开。",
          "如果不同，卡片会翻回去。请记住它们的位置！",
          "用最少的步数消除所有卡片。"
        ],
        difficultyParams: {
          easy: '3×4 网格，6对卡片',
          medium: '4×4 网格，8对卡片',
          hard: '5×4 网格，10对卡片，预览时间更短'
        }
      },
      gonogo: {
        title: 'Go/No-Go 任务',
        desc: '训练反应抑制能力和反应速度。',
        cognitive: '抑制控制 · 持续注意',
        instructions: [
          "屏幕上会出现一个刺激物。",
          "如果是【绿色】，请尽快做出反应。",
          "如果是【红色】，请不要做任何操作。",
          "速度很重要，但准确性更关键。"
        ],
        good: '正确',
        missed: '漏报',
        dontClick: '误报',
        wait: '准备...',
        difficultyParams: {
          easy: '70% Go试次，800ms反应窗口',
          medium: '60% Go试次，600ms反应窗口',
          hard: '50% Go试次，400ms反应窗口，变化ISI'
        }
      },
      stroop: {
        title: 'Stroop 测试',
        desc: '测量认知控制和抗干扰能力。',
        cognitive: '认知灵活性 · 干扰抑制',
        instructions: [
          "屏幕上会出现一个表示颜色的词。",
          "请选择与文字【墨水颜色】相匹配的按钮。",
          "忽略文字本身的含义！",
          "例如：用蓝色墨水写的『红』字 → 点击『蓝色』。"
        ],
        difficultyParams: {
          easy: '70% 一致试次，4种颜色',
          medium: '50% 一致试次，4种颜色',
          hard: '30% 一致试次，6种颜色'
        }
      }
    },
    dashboard: {
      title: '首页',
      subtitle: '您的认知训练进度概览。',
      totalGames: '总训练次数',
      avgScore: '平均准确率',
      trainingTime: '训练时长',
      streak: '连续天数',
      recentTrend: '近期表现趋势',
      cognitiveProfile: '认知能力画像',
      avgScoreByGame: '各项目表现',
      exportJsonMe: '导出 JSON',
      exportJsonAll: '导出全部',
      exportCsv: '导出 CSV',
      insights: '洞察分析',
      noInsights: '完成更多训练后可查看洞察分析。',
      strengths: '优势领域',
      areasToImprove: '待提升领域',
      recommendations: '训练建议',
      avgAccuracy: '准确率',
      avgRT: '平均反应时',
      noData: '暂无训练数据',
      startTraining: '完成一些训练后，您将在此看到表现数据和洞察分析。'
    },
    nav: {
      games: '训练项目',
      analytics: '数据分析',
      history: '历史记录',
      admin: '管理后台',
      dashboard: '首页'
    },
    analytics: {
      title: '深度分析',
      subtitle: '深入分析反应时间、变异性和错误模式。',
      rtDist: '反应时间分布',
      rtTrend: '反应时间趋势 (最近100次)',
      rtvTrend: '注意力稳定性 (RTV趋势)',
      rtvDesc: '变异系数 (CV) 基于滑窗计算。数值越低越稳定。',
      errorTypes: '错误分析',
      stroopEffect: 'Stroop 干扰效应',
      effectSize: '效应量',
      filterByGame: '按任务筛选',
      filterByDifficulty: '按难度筛选',
      filterByDate: '按日期筛选',
      allGames: '全部任务',
      allDifficulties: '全部难度',
      meanRT: '平均反应时',
      medianRT: '中位反应时',
      sdRT: '标准差',
      cv: '变异系数%',
      omissionErrors: '漏报错误',
      commissionErrors: '误报错误',
      hitRate: '命中率',
      falseAlarmRate: '误报率',
      dPrime: "d' (敏感性)"
    },
    history: {
      title: '训练历史',
      subtitle: '所有训练会话的详细日志。',
      date: '日期',
      game: '任务',
      score: '分数',
      time: '用时',
      totalTime: '总用时',
      performance: '表现指标',
      trialData: '试次数据',
      accuracy: '准确率',
      meanRT: '平均反应时',
      actions: '操作',
      details: '详情',
      errors: '错误数',
      sdRT: '标准差',
      trial: '试次',
      type: '类型',
      response: '反应',
      result: '结果',
      difficulty: '难度',
      noHistory: '暂无训练记录。开始一次训练后即可在此查看数据。'
    },
    admin: {
      title: '管理后台',
      description: '查看和分析所有用户的训练数据。',
      totalUsers: '总用户数',
      totalSessions: '总训练次数',
      completionRate: '完成率',
      userList: '用户列表',
      userListDesc: '点击查看用户详细数据',
      exportAll: '导出全部',
      searchPlaceholder: '搜索用户...',
      lastActive: '最后活跃',
      noUsers: '暂无用户数据',
      userData: '用户数据',
      userSessions: '用户训练记录',
      exportUserData: '导出用户数据',
      backToList: '返回列表',
      accessDenied: '访问受限',
      accessDeniedDesc: '您没有权限访问管理后台。只有管理员账号可以访问此页面。'
    },
    leaderboard: {
      title: '排行榜',
      description: '查看训练排名，与其他用户一较高下',
      overall: '综合排行',
      game: '单项游戏',
      participation: '参与度',
      overallTitle: '综合能力排行',
      overallDesc: '基于反应速度、准确率和稳定性的综合评分',
      gameTitle: '排行榜',
      gameDesc: '基于最高分排名',
      participationTitle: '参与度排行',
      participationDesc: '基于训练次数排名',
      noData: '暂无排行数据',
      you: '你',
      sessions: '次训练',
      times: '次',
      accuracy: '准确率',
      avgRt: '平均RT',
      stability: '稳定性',
      bestScore: '最高分',
      totalScore: '总分',
      score: '分',
      trainingCount: '训练次数',
      totalDuration: '总时长',
      totalTrials: '总试次',
      lastTraining: '最后训练',
      minutes: '分钟',
      today: '今日',
      week: '本周',
      month: '本月',
      allTime: '全部时间',
    },
    insights: {
      attentionStability: '注意力稳定性',
      reactionSpeed: '反应速度',
      inhibitionControl: '抑制控制',
      workingMemory: '工作记忆',
      interferenceControl: '抗干扰能力',
      high: '高',
      moderate: '中等',
      low: '低',
      improving: '提升中',
      stable: '稳定',
      declining: '下降中',
      // Insight messages
      highRtvWarning: '您的反应时间波动较大，提示注意力不够稳定。建议尝试更短、更频繁的训练。',
      lowRtvGood: '您的注意力稳定性表现优秀，请保持这种状态。',
      highCommissionWarning: '误报率较高，提示冲动控制需要加强。建议在更高难度下练习 Go/No-Go 任务。',
      highOmissionWarning: '漏报率较高，提示存在注意力缺失。建议在训练间隙适当休息。',
      strongStroopEffect: 'Stroop效应较大，提示抗干扰能力有提升空间。建议定期练习 Stroop 测试。',
      goodInhibition: '您的抑制控制能力很强，可以尝试更高难度的挑战。',
      fastReaction: '您的反应速度高于平均水平，请注意保持准确性。',
      slowReaction: '您的反应时间有提升空间，持续练习会有帮助。',
      goodMemory: '您的工作记忆表现良好，可以尝试提高难度。',
      memoryNeedsWork: '工作记忆有提升空间，建议多练习记忆翻牌任务。'
    },
    landing: {
      hero: {
        title: '训练大脑，',
        titleHighlight: '量化进步',
        subtitle: '一个为科学精度和可行动洞察而设计的研究级认知训练平台。',
        cta: '立即开始',
        secondaryCta: '了解更多'
      },
      features: {
        title: '专业认知训练平台',
        scientific: {
          title: '科学设计',
          desc: '基于认知心理学研究的训练任务，精准记录每次表现。'
        },
        insights: {
          title: '可行动洞察',
          desc: '通过详细分析和个性化建议，了解您的认知优势和待提升领域。'
        },
        cloud: {
          title: '云端同步',
          desc: '数据跨设备同步。随时随地训练，随时随地分析。'
        },
        privacy: {
          title: '隐私优先',
          desc: '您的认知数据属于您自己。完全控制数据导出和删除。'
        }
      },
      tasks: {
        title: '四项核心训练任务',
        subtitle: '每项任务针对特定认知能力，支持难度调节。'
      }
    }
  }
};
