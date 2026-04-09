export interface KnowledgePoint {
  id: string;
  name: string;
  hasChart?: boolean; // whether this topic commonly involves charts/figures
}

export interface GradeLevel {
  grade: string;
  label: string; // display label
  points: KnowledgePoint[];
}

export interface Subject {
  id: string;
  name: string;
  grades: GradeLevel[];
}

const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: '数学',
    grades: [
      {
        grade: '一年级', label: '小学一年级', points: [
          { id: 'num_20', name: '20以内加减法' },
          { id: 'shapes_basic', name: '认识图形', hasChart: true },
          { id: 'count', name: '数的认识(0-20)' },
          { id: 'compare', name: '大小比较' },
        ],
      },
      {
        grade: '二年级', label: '小学二年级', points: [
          { id: 'mul_table', name: '乘法口诀' },
          { id: 'div_basic', name: '表内除法' },
          { id: 'add_100', name: '百以内加减法' },
          { id: 'length', name: '厘米和米' },
          { id: 'data_basic', name: '简单数据整理', hasChart: true },
        ],
      },
      {
        grade: '三年级', label: '小学三年级', points: [
          { id: 'mul_multi', name: '多位数乘一位数' },
          { id: 'div_multi', name: '多位数除法' },
          { id: 'fraction_intro', name: '分数初步' },
          { id: 'area_intro', name: '面积初步', hasChart: true },
          { id: 'time', name: '时间与时刻' },
          { id: 'unit_length', name: '千米和毫米' },
        ],
      },
      {
        grade: '四年级', label: '小学四年级', points: [
          { id: 'large_num', name: '大数的认识' },
          { id: 'mul_3x2', name: '三位数乘两位数' },
          { id: 'div_2digit', name: '除数是两位数的除法' },
          { id: 'decimal_intro', name: '小数的意义与性质' },
          { id: 'angle', name: '角的度量', hasChart: true },
          { id: 'stats_bar', name: '统计条形图', hasChart: true },
        ],
      },
      {
        grade: '五年级', label: '小学五年级', points: [
          { id: 'decimal_mul', name: '小数乘法' },
          { id: 'decimal_div', name: '小数除法' },
          { id: 'fraction_add', name: '分数加减法' },
          { id: 'polygon_area', name: '多边形面积', hasChart: true },
          { id: 'equation_intro', name: '简易方程' },
          { id: 'stats_fold', name: '折线统计图', hasChart: true },
        ],
      },
      {
        grade: '六年级', label: '小学六年级', points: [
          { id: 'fraction_mul', name: '分数乘除法' },
          { id: 'ratio', name: '比和比例' },
          { id: 'percent', name: '百分数' },
          { id: 'circle', name: '圆的面积与周长', hasChart: true },
          { id: 'cylinder', name: '圆柱与圆锥' },
          { id: 'stats_pie', name: '扇形统计图', hasChart: true },
        ],
      },
      {
        grade: '七年级', label: '初一', points: [
          { id: 'rational_num', name: '有理数' },
          { id: 'algebra_expr', name: '整式加减' },
          { id: 'linear_eq1', name: '一元一次方程' },
          { id: 'geometry_intro', name: '几何图形初步', hasChart: true },
          { id: 'intersect_parallel', name: '相交线与平行线', hasChart: true },
          { id: 'data_stats', name: '数据统计', hasChart: true },
        ],
      },
      {
        grade: '八年级', label: '初二', points: [
          { id: 'integer_op', name: '整式乘除' },
          { id: 'factoring', name: '因式分解' },
          { id: 'fraction_expr', name: '分式' },
          { id: 'inequality', name: '一次不等式组' },
          { id: 'quadrilateral', name: '平行四边形', hasChart: true },
          { id: 'function_linear', name: '一次函数', hasChart: true },
          { id: 'pythagorean', name: '勾股定理', hasChart: true },
        ],
      },
      {
        grade: '九年级', label: '初三', points: [
          { id: 'quadratic_eq', name: '一元二次方程' },
          { id: 'quadratic_func', name: '二次函数', hasChart: true },
          { id: 'similar_triangle', name: '相似三角形', hasChart: true },
          { id: 'circle_theory', name: '圆', hasChart: true },
          { id: 'trig_intro', name: '锐角三角函数', hasChart: true },
          { id: 'probability', name: '概率初步' },
        ],
      },
      {
        grade: '高一', label: '高一', points: [
          { id: 'set_theory', name: '集合与逻辑' },
          { id: 'func_concept', name: '函数概念与性质', hasChart: true },
          { id: 'exp_log', name: '指数函数与对数函数', hasChart: true },
          { id: 'trig_func', name: '三角函数', hasChart: true },
          { id: 'vector_2d', name: '平面向量' },
          { id: 'trig_identity', name: '三角恒等变换' },
        ],
      },
      {
        grade: '高二', label: '高二', points: [
          { id: 'sequence', name: '数列' },
          { id: 'inequality_h', name: '不等式' },
          { id: 'conic', name: '圆锥曲线', hasChart: true },
          { id: 'derivative', name: '导数及应用', hasChart: true },
          { id: 'solid_geo', name: '立体几何', hasChart: true },
          { id: 'stats_h', name: '统计与概率', hasChart: true },
        ],
      },
      {
        grade: '高三', label: '高三', points: [
          { id: 'permutation', name: '排列与组合' },
          { id: 'probability_h', name: '概率与统计', hasChart: true },
          { id: 'complex_num', name: '复数' },
          { id: 'review_func', name: '函数综合' },
          { id: 'review_trig', name: '三角综合' },
          { id: 'review_analytic', name: '解析几何综合', hasChart: true },
        ],
      },
    ],
  },
  {
    id: 'chinese',
    name: '语文',
    grades: [
      {
        grade: '一年级', label: '小学一年级', points: [
          { id: 'pinyin', name: '汉语拼音' },
          { id: 'stroke', name: '笔画与笔顺' },
          { id: 'idiom_1', name: '词语积累' },
          { id: 'sentence_1', name: '句子练习' },
        ],
      },
      {
        grade: '二年级', label: '小学二年级', points: [
          { id: 'char_recognize', name: '识字与写字' },
          { id: 'antonym', name: '近义词与反义词' },
          { id: 'paragraph', name: '段落理解' },
          { id: 'poem_2', name: '古诗文背诵' },
        ],
      },
      {
        grade: '三年级', label: '小学三年级', points: [
          { id: 'composition_3', name: '写作基础' },
          { id: 'reading_3', name: '阅读理解' },
          { id: 'idiom_3', name: '成语' },
          { id: 'poem_3', name: '古诗词鉴赏' },
        ],
      },
      {
        grade: '四年级', label: '小学四年级', points: [
          { id: 'rhetorical', name: '修辞手法' },
          { id: 'reading_4', name: '记叙文阅读' },
          { id: 'poem_4', name: '文言文初步' },
          { id: 'composition_4', name: '写作技巧' },
        ],
      },
      {
        grade: '五年级', label: '小学五年级', points: [
          { id: 'narrative', name: '叙事写作' },
          { id: 'prose', name: '散文阅读' },
          { id: 'classical_5', name: '文言文阅读' },
          { id: 'poem_5', name: '古典诗词' },
        ],
      },
      {
        grade: '六年级', label: '小学六年级', points: [
          { id: 'argumentative', name: '议论文基础' },
          { id: 'reading_6', name: '综合阅读' },
          { id: 'classical_6', name: '文言文理解' },
          { id: 'poem_6', name: '诗词赏析' },
        ],
      },
      {
        grade: '七年级', label: '初一', points: [
          { id: 'narrative_7', name: '记叙文阅读与写作' },
          { id: 'classical_7', name: '文言文基础' },
          { id: 'poem_7', name: '古诗词积累' },
          { id: 'word_usage', name: '词语运用' },
        ],
      },
      {
        grade: '八年级', label: '初二', points: [
          { id: 'expository', name: '说明文阅读' },
          { id: 'classical_8', name: '文言文阅读' },
          { id: 'poem_8', name: '诗歌鉴赏' },
          { id: 'composition_8', name: '作文（写景·叙事）' },
        ],
      },
      {
        grade: '九年级', label: '初三', points: [
          { id: 'argumentative_9', name: '议论文阅读与写作' },
          { id: 'classical_9', name: '文言文综合' },
          { id: 'modern_lit', name: '现代文学欣赏' },
          { id: 'exam_writing', name: '中考作文训练' },
        ],
      },
      {
        grade: '高一', label: '高一', points: [
          { id: 'modern_poem', name: '现代诗歌' },
          { id: 'classical_h1', name: '文言文阅读' },
          { id: 'essay_h1', name: '实用类文本阅读' },
          { id: 'composition_h1', name: '议论文写作' },
        ],
      },
      {
        grade: '高二', label: '高二', points: [
          { id: 'novel_h2', name: '小说阅读' },
          { id: 'classical_h2', name: '文言文与诗词' },
          { id: 'rhetoric_h2', name: '语言文字运用' },
          { id: 'composition_h2', name: '综合写作' },
        ],
      },
      {
        grade: '高三', label: '高三', points: [
          { id: 'gaokao_read', name: '高考阅读专训' },
          { id: 'gaokao_classical', name: '高考文言文专训' },
          { id: 'gaokao_write', name: '高考作文专训' },
          { id: 'gaokao_language', name: '语言文字综合运用' },
        ],
      },
    ],
  },
  {
    id: 'english',
    name: '英语',
    grades: [
      {
        grade: '三年级', label: '小学三年级', points: [
          { id: 'alphabet', name: '字母与单词' },
          { id: 'greeting', name: '问候语' },
          { id: 'color_num', name: '颜色与数字' },
        ],
      },
      {
        grade: '四年级', label: '小学四年级', points: [
          { id: 'vocab_4', name: '词汇积累' },
          { id: 'sentence_4', name: '简单句型' },
          { id: 'read_4', name: '简单阅读' },
        ],
      },
      {
        grade: '五年级', label: '小学五年级', points: [
          { id: 'tense_present', name: '一般现在时' },
          { id: 'vocab_5', name: '词汇与短语' },
          { id: 'dialogue_5', name: '情景对话' },
        ],
      },
      {
        grade: '六年级', label: '小学六年级', points: [
          { id: 'tense_past', name: '一般过去时' },
          { id: 'reading_6', name: '阅读理解' },
          { id: 'writing_6', name: '简单写作' },
        ],
      },
      {
        grade: '七年级', label: '初一', points: [
          { id: 'grammar_7', name: '基础语法' },
          { id: 'vocab_7', name: '词汇拓展' },
          { id: 'reading_7', name: '阅读理解' },
          { id: 'writing_7', name: '写作基础' },
        ],
      },
      {
        grade: '八年级', label: '初二', points: [
          { id: 'tense_all', name: '时态综合' },
          { id: 'clause', name: '从句基础' },
          { id: 'reading_8', name: '阅读理解' },
          { id: 'writing_8', name: '短文写作' },
        ],
      },
      {
        grade: '九年级', label: '初三', points: [
          { id: 'grammar_9', name: '语法综合' },
          { id: 'reading_9', name: '阅读综合' },
          { id: 'cloze', name: '完形填空' },
          { id: 'writing_9', name: '中考写作' },
        ],
      },
      {
        grade: '高一', label: '高一', points: [
          { id: 'vocab_h1', name: '词汇与词组' },
          { id: 'grammar_h1', name: '高中语法基础' },
          { id: 'reading_h1', name: '阅读理解' },
          { id: 'writing_h1', name: '书面表达' },
        ],
      },
      {
        grade: '高二', label: '高二', points: [
          { id: 'advanced_grammar', name: '高级语法' },
          { id: 'reading_h2', name: '篇章阅读' },
          { id: 'cloze_h2', name: '完形填空' },
          { id: 'writing_h2', name: '图表作文', hasChart: true },
        ],
      },
      {
        grade: '高三', label: '高三', points: [
          { id: 'gaokao_read', name: '高考阅读专训' },
          { id: 'gaokao_cloze', name: '高考完形填空' },
          { id: 'gaokao_write', name: '高考写作专训' },
          { id: 'gaokao_grammar', name: '语法填空' },
        ],
      },
    ],
  },
  {
    id: 'physics',
    name: '物理',
    grades: [
      {
        grade: '八年级', label: '初二', points: [
          { id: 'mechanics_intro', name: '运动与力基础', hasChart: true },
          { id: 'optics', name: '光学', hasChart: true },
          { id: 'sound', name: '声学' },
          { id: 'heat', name: '热学' },
        ],
      },
      {
        grade: '九年级', label: '初三', points: [
          { id: 'electricity_intro', name: '电路基础', hasChart: true },
          { id: 'ohm', name: '欧姆定律', hasChart: true },
          { id: 'power', name: '电功率' },
          { id: 'magnet', name: '电磁现象' },
        ],
      },
      {
        grade: '高一', label: '高一', points: [
          { id: 'kinematics', name: '运动学', hasChart: true },
          { id: 'newton', name: '牛顿运动定律' },
          { id: 'work_energy', name: '功与能', hasChart: true },
          { id: 'momentum', name: '动量' },
        ],
      },
      {
        grade: '高二', label: '高二', points: [
          { id: 'electrostatics', name: '静电场', hasChart: true },
          { id: 'circuit', name: '电路', hasChart: true },
          { id: 'mag_field', name: '磁场', hasChart: true },
          { id: 'em_induction', name: '电磁感应' },
        ],
      },
      {
        grade: '高三', label: '高三', points: [
          { id: 'waves', name: '机械波', hasChart: true },
          { id: 'optics_h', name: '光学综合', hasChart: true },
          { id: 'modern_phys', name: '近代物理' },
          { id: 'review_phys', name: '综合复习' },
        ],
      },
    ],
  },
  {
    id: 'chemistry',
    name: '化学',
    grades: [
      {
        grade: '九年级', label: '初三', points: [
          { id: 'matter', name: '物质的变化与性质' },
          { id: 'atom', name: '原子结构' },
          { id: 'compound', name: '化合物与混合物' },
          { id: 'reaction', name: '化学反应方程式' },
          { id: 'oxide', name: '氧化物与酸碱盐' },
        ],
      },
      {
        grade: '高一', label: '高一', points: [
          { id: 'classify', name: '物质的分类与转化' },
          { id: 'ion_reaction', name: '离子反应' },
          { id: 'redox', name: '氧化还原反应' },
          { id: 'nonmetal', name: '非金属及其化合物' },
          { id: 'metal', name: '金属及其化合物' },
        ],
      },
      {
        grade: '高二', label: '高二', points: [
          { id: 'mole', name: '化学计量' },
          { id: 'equil', name: '化学平衡', hasChart: true },
          { id: 'electrochem', name: '电化学', hasChart: true },
          { id: 'organic_intro', name: '有机化合物基础' },
        ],
      },
      {
        grade: '高三', label: '高三', points: [
          { id: 'organic_h', name: '有机化学综合' },
          { id: 'inorganic_h', name: '无机综合' },
          { id: 'experiment', name: '化学实验' },
          { id: 'review_chem', name: '综合专题复习' },
        ],
      },
    ],
  },
  {
    id: 'biology',
    name: '生物',
    grades: [
      {
        grade: '七年级', label: '初一', points: [
          { id: 'cell', name: '细胞是生命活动的基本单位' },
          { id: 'plant', name: '植物的生命活动' },
          { id: 'classify_bio', name: '生物的分类' },
        ],
      },
      {
        grade: '八年级', label: '初二', points: [
          { id: 'animal', name: '动物的运动与行为' },
          { id: 'genetics_intro', name: '遗传与进化基础' },
          { id: 'ecology', name: '生态系统', hasChart: true },
        ],
      },
      {
        grade: '九年级', label: '初三', points: [
          { id: 'health', name: '健康与疾病' },
          { id: 'biotech', name: '生物技术简介' },
          { id: 'review_bio', name: '综合复习' },
        ],
      },
      {
        grade: '高一', label: '高一', points: [
          { id: 'cell_h', name: '细胞的结构与功能' },
          { id: 'metabolism', name: '物质与能量代谢', hasChart: true },
          { id: 'cell_division', name: '细胞增殖' },
        ],
      },
      {
        grade: '高二', label: '高二', points: [
          { id: 'genetics', name: '遗传与变异', hasChart: true },
          { id: 'hormones', name: '调节机制' },
          { id: 'ecology_h', name: '生态学', hasChart: true },
        ],
      },
      {
        grade: '高三', label: '高三', points: [
          { id: 'biotech_h', name: '现代生物技术' },
          { id: 'review_bio_h', name: '高考生物综合' },
        ],
      },
    ],
  },
  {
    id: 'history',
    name: '历史',
    grades: [
      {
        grade: '七年级', label: '初一', points: [
          { id: 'ancient_china', name: '中国古代史（先秦至秦汉）' },
          { id: 'world_ancient', name: '世界上古史' },
        ],
      },
      {
        grade: '八年级', label: '初二', points: [
          { id: 'modern_china', name: '中国近代史' },
          { id: 'world_modern', name: '世界近代史' },
        ],
      },
      {
        grade: '九年级', label: '初三', points: [
          { id: 'contemporary', name: '中国现代史' },
          { id: 'world_contemporary', name: '世界现代史' },
        ],
      },
      {
        grade: '高一', label: '高一', points: [
          { id: 'politics_h1', name: '政治制度史' },
          { id: 'economy_h1', name: '经济史', hasChart: true },
        ],
      },
      {
        grade: '高二', label: '高二', points: [
          { id: 'culture_h2', name: '文化与思想史' },
          { id: 'intl_rel', name: '国际关系史' },
        ],
      },
      {
        grade: '高三', label: '高三', points: [
          { id: 'review_hist', name: '历史综合复习' },
          { id: 'gaokao_hist', name: '高考历史专训' },
        ],
      },
    ],
  },
  {
    id: 'geography',
    name: '地理',
    grades: [
      {
        grade: '七年级', label: '初一', points: [
          { id: 'map_skills', name: '地图基础', hasChart: true },
          { id: 'earth', name: '地球与地图', hasChart: true },
          { id: 'climate', name: '气候与天气', hasChart: true },
        ],
      },
      {
        grade: '八年级', label: '初二', points: [
          { id: 'china_geo', name: '中国地理概况', hasChart: true },
          { id: 'region', name: '中国区域地理', hasChart: true },
        ],
      },
      {
        grade: '高一', label: '高一', points: [
          { id: 'natural_geo', name: '自然地理', hasChart: true },
          { id: 'atmo', name: '大气运动', hasChart: true },
          { id: 'hydro', name: '水文地理', hasChart: true },
        ],
      },
      {
        grade: '高二', label: '高二', points: [
          { id: 'human_geo', name: '人文地理', hasChart: true },
          { id: 'industry', name: '工业与农业布局', hasChart: true },
          { id: 'urban', name: '城镇化', hasChart: true },
        ],
      },
      {
        grade: '高三', label: '高三', points: [
          { id: 'review_geo', name: '地理综合复习', hasChart: true },
          { id: 'gaokao_geo', name: '高考地理专训', hasChart: true },
        ],
      },
    ],
  },
];

export default SUBJECTS;

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

export function getGradeLevel(subjectId: string, grade: string): GradeLevel | undefined {
  return getSubject(subjectId)?.grades.find((g) => g.grade === grade);
}
