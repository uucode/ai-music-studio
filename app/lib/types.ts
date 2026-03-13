export type MusicStyle = 'R&B' | '流行' | '抒情' | '电子' | '民谣' | '国风' | '爵士' | '说唱' | '摇滚' | '治愈';
export type Mood = '开心' | '难过' | '暧昧' | '失落' | '平静' | '浪漫' | '孤独' | '治愈' | '放松' | '怀旧' | '自由' | '想念';
export type MBTI = 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP' | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';
export type Constellation = '白羊座' | '金牛座' | '双子座' | '巨蟹座' | '狮子座' | '处女座' | '天秤座' | '天蝎座' | '射手座' | '摩羯座' | '水瓶座' | '双鱼座';

export type MusicShare = {
  title: string;
  lyrics: string;
  audioUrl: string;
  style: string;
  nickname: string;
  createdAt: string;
};

export type MusicSong = {
  title: string;
  lyrics: string;
  audioUrl: string;
  style: string;
  createdAt: string;
};
