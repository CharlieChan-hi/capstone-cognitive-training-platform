import { UserPool, GameScore } from './types';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

export const exportJSON = (data: object, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, filename);
};

export const generateCSVData = (pool: UserPool) => {
  const rows: any[] = [];
  
  Object.keys(pool).forEach(username => {
    const user = pool[username];
    user.stats.scores.forEach(score => {
      rows.push({
        '用户名': username,
        '游戏类型': score.game,
        '得分': score.score,
        '用时(秒)': (score.time / 1000).toFixed(2),
        '准确率(%)': score.accuracy,
        '日期时间': new Date(score.date).toLocaleString(),
        '平均反应时(ms)': score.metrics?.meanRT?.toFixed(0) || '',
        '反应时标准差': score.metrics?.sdRT?.toFixed(0) || '',
        '漏报错误': score.metrics?.omissionErrors || 0,
        '误报错误': score.metrics?.commissionErrors || 0,
        '命中率': score.metrics?.hitRate?.toFixed(2) || '',
        '误报率': score.metrics?.falseAlarmRate?.toFixed(2) || ''
      });
    });
  });
  
  return rows;
};

export const exportCSV = (pool: UserPool, filename: string) => {
  const data = generateCSVData(pool);
  const csv = Papa.unparse(data);
  // Add BOM for Excel compatibility
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

// Helper to format timestamp for filenames
export const getFormattedTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
};
