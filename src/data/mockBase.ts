import { Category, Department, Station, ReplyTemplate, Standard } from '@/types';

export const categories: Category[] = [
  { id: 'c1', name: '票务服务', level: 1 },
  { id: 'c1-1', name: '购票问题', parentId: 'c1', level: 2 },
  { id: 'c1-2', name: '退票改签', parentId: 'c1', level: 2 },
  { id: 'c1-3', name: '票价争议', parentId: 'c1', level: 2 },
  { id: 'c2', name: '客运服务', level: 1 },
  { id: 'c2-1', name: '旅客服务', parentId: 'c2', level: 2 },
  { id: 'c2-2', name: '乘车环境', parentId: 'c2', level: 2 },
  { id: 'c2-3', name: '重点旅客服务', parentId: 'c2', level: 2 },
  { id: 'c3', name: '站车设施', level: 1 },
  { id: 'c3-1', name: '候车室设施', parentId: 'c3', level: 2 },
  { id: 'c3-2', name: '车厢设施', parentId: 'c3', level: 2 },
  { id: 'c3-3', name: '卫生间设施', parentId: 'c3', level: 2 },
  { id: 'c4', name: '运行秩序', level: 1 },
  { id: 'c4-1', name: '晚点延误', parentId: 'c4', level: 2 },
  { id: 'c4-2', name: '乘车秩序', parentId: 'c4', level: 2 },
  { id: 'c5', name: '其他投诉', level: 1 },
  { id: 'c5-1', name: '服务态度', parentId: 'c5', level: 2 },
  { id: 'c5-2', name: '信息告知', parentId: 'c5', level: 2 },
];

export const departments: Department[] = [
  { id: 'd1', name: '客运部' },
  { id: 'd2', name: '票务部' },
  { id: 'd3', name: '运输部' },
  { id: 'd4', name: '车辆段' },
  { id: 'd5', name: '车站服务中心' },
  { id: 'd6', name: '信息技术部' },
];

export const stations: Station[] = [
  { id: 's1', name: '北京南站' },
  { id: 's2', name: '上海虹桥站' },
  { id: 's3', name: '广州南站' },
  { id: 's4', name: '深圳北站' },
  { id: 's5', name: '成都东站' },
  { id: 's6', name: '西安北站' },
  { id: 's7', name: '武汉站' },
  { id: 's8', name: '南京南站' },
];

export const replyTemplates: ReplyTemplate[] = [
  {
    id: 't1',
    title: '一般咨询答复模板',
    categoryId: 'c1',
    content: '尊敬的旅客您好！感谢您的咨询。关于您反映的{{问题类型}}问题，我们已受理并正在核实处理中。我们将在24小时内给您正式回复，如有紧急情况请拨打12306服务热线。感谢您对铁路工作的理解与支持！'
  },
  {
    id: 't2',
    title: '投诉致歉模板',
    categoryId: 'c5',
    content: '尊敬的旅客您好！首先对您在乘车过程中遇到的不便深表歉意。我们高度重视您反映的{{问题类型}}问题，已转至相关部门调查核实，将在规定时限内给您满意答复。铁路服务的提升离不开您的监督，再次感谢您的宝贵意见！'
  },
  {
    id: 't3',
    title: '晚点解释模板',
    categoryId: 'c4-1',
    content: '尊敬的旅客您好！关于您乘坐的{{车次}}次列车晚点问题，我们深表歉意。列车晚点原因为{{晚点原因}}，铁路部门正全力组织恢复运行秩序。您可通过12306办理全额退票或改签，感谢您的耐心与理解！'
  },
  {
    id: 't4',
    title: '票务问题处理模板',
    categoryId: 'c1',
    content: '尊敬的旅客您好！您反映的票务问题我们已经记录。您可以携带购票时使用的有效身份证件原件到车站售票窗口办理相关手续，也可以通过12306网站或APP自助办理。如有疑问请随时致电12306，我们将竭诚为您服务。'
  },
];

export const standards: Standard[] = [
  {
    id: 'st1',
    clauseNo: 'TJ-001',
    title: '旅客投诉受理时限标准',
    categoryId: 'c2',
    categoryName: '客运服务',
    applicableScope: '全路各车站、列车',
    content: '1. 旅客投诉应在24小时内完成受理登记，紧急投诉（涉及安全、人身伤害等）须在1小时内响应。\n2. 投诉受理后应立即转至责任部门，责任部门须在3个工作日内完成调查并提出处理意见。\n3. 一般投诉应在7个工作日内答复旅客，复杂投诉最长不超过15个工作日。\n4. 对实名投诉，处理结果须以书面或电话方式回复投诉人。'
  },
  {
    id: 'st2',
    clauseNo: 'TJ-002',
    title: '车站旅客服务质量标准',
    categoryId: 'c2',
    categoryName: '客运服务',
    applicableScope: '二等及以上车站',
    content: '1. 候车室温度夏季26-28℃，冬季18-20℃。\n2. 卫生间保持清洁无异味，每30分钟巡查一次。\n3. 饮水处24小时供应开水，纸杯充足。\n4. 重点旅客（老、幼、病、残、孕）候车专区有专人服务。\n5. 问询处响应时间不超过2分钟，解答准确率100%。\n6. 检票口提前15分钟开始检票，开车前3分钟停止检票。'
  },
  {
    id: 'st3',
    clauseNo: 'TJ-003',
    title: '列车旅客服务质量标准',
    categoryId: 'c2',
    categoryName: '客运服务',
    applicableScope: '动车组、特快、快速列车',
    content: '1. 列车始发前做好整备工作，车内温度夏季24-28℃，冬季18-22℃。\n2. 列车员立岗迎接旅客，使用规范文明用语。\n3. 旅客上车后30分钟内完成安全宣传和设施介绍。\n4. 硬座车每2小时巡视一次，硬卧车每4小时巡视一次。\n5. 餐车食品明码标价，供餐时间不少于3小时。\n6. 重点旅客做到"三知三有"（知座席、知到站、知困难，有登记、有服务、有交接）。'
  },
  {
    id: 'st4',
    clauseNo: 'TJ-004',
    title: '票务服务质量标准',
    categoryId: 'c1',
    categoryName: '票务服务',
    applicableScope: '全路各车站售票窗口、代售点',
    content: '1. 售票窗口排队人数不超过20人，超过时增开窗口。\n2. 每张车票售票时间不超过3分钟。\n3. 退票窗口做到"随到随退"，等待时间不超过10分钟。\n4. 车票预售期严格执行国家铁路集团规定。\n5. 售票差错率控制在0.1%以下。\n6. 窗口人员必须熟练掌握票价、里程、中转换乘等业务知识。'
  },
  {
    id: 'st5',
    clauseNo: 'TJ-005',
    title: '站车设施维护标准',
    categoryId: 'c3',
    categoryName: '站车设施',
    applicableScope: '车站及列车设施设备',
    content: '1. 候车座椅完好率不低于98%，损坏座椅24小时内修复。\n2. 自动扶梯、电梯正常运行率不低于99%，故障后4小时内到场维修。\n3. 电子显示屏显示准确率100%，故障后2小时内修复。\n4. 列车上空调、照明、给排水系统运行良好，出库合格率100%。\n5. 无障碍设施完好率100%，确保重点旅客正常使用。\n6. 建立设施巡检台账，每日记录运行状态。'
  },
  {
    id: 'st6',
    clauseNo: 'TJ-006',
    title: '重点旅客服务标准',
    categoryId: 'c2-3',
    categoryName: '重点旅客服务',
    applicableScope: '全路各车站、列车',
    content: '1. 重点旅客（老、幼、病、残、孕）享有优先购票、优先进站、优先检票、优先上车服务。\n2. 车站设置重点旅客候车区，配备专座、轮椅、担架等服务设备。\n3. 车站接到重点旅客预约服务后，提前30分钟安排专人在指定位置迎接。\n4. 列车上重点旅客座席旁设置呼叫装置，列车员响应时间不超过3分钟。\n5. 重点旅客换乘时，车站之间做好交接，确保服务无缝衔接。\n6. 每月对重点旅客服务质量进行满意度调查，满意度不低于95%。'
  },
];

export const standardCategories = [
  { id: 'c2', name: '客运服务' },
  { id: 'c1', name: '票务服务' },
  { id: 'c3', name: '站车设施' },
  { id: 'c4', name: '运行秩序' },
];
