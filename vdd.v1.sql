


# 系统日志
CREATE TABLE syslog(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP)  COMMENT '新增时间',
  memo varchar(200) COMMENT '备注',
  level varchar(20) COMMENT '级别',
  cat varchar(20) COMMENT '类型',
  ip varchar(20) COMMENT 'ip地址',
  imei varchar(20) COMMENT '设备imei',
  token varchar(200) COMMENT '令牌',
  class varchar(100) COMMENT '类名',
  action varchar(50) COMMENT 'action名',
  msg varchar(500) COMMENT '日志信息',
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;


# 系统字典
CREATE OR REPLACE TABLE sysdict(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',

  catgroy varchar(50) COMMENT '类型',
  dict json COMMENT '字典数据, json [{k,v}]',
  
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

INSERT INTO sysdict(catgroy, memo, dict) VALUES('ROUTE_TYPE', '巡更线路类型', '["fixed", "free"]' );
INSERT INTO sysdict(catgroy, memo, dict) VALUES('TAG_TYPE', 'tag类型', JSON_ARRAY('NFC', 'beacon') );


# 检查值是否在字典存在, select checkindictarr('TAG_TYPE', 'NFC')
create OR REPLACE FUNCTION checkindictarr(catgroy varchar(50), v varchar(50)) # RETURNS INT
RETURNS INT
BEGIN
return (
  select JSON_CONTAINS(d.dict, JSON_QUOTE(v))
    from sysdict d
    where d.catgroy=catgroy 
      and d.state=1
    limit 1
    );
END;



# 系统用户/雇员
CREATE or REPLACE TABLE user(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',	

  usr VARCHAR(50) COMMENT '登陆账户',
  pwd VARCHAR(50) COMMENT '登陆口令',
  code VARCHAR(50) COMMENT '编号',
  cardId VARCHAR(50) COMMENT '卡号,nfc卡的id',
  roleId BIGINT unsigned Null COMMENT '角色, 对应 role表的id',
  orgIds JSON COMMENT '所属机构, json数组',
  cnName VARCHAR(50) COMMENT '简体姓名',
  hkName VARCHAR(50) COMMENT '繁体姓名',
  enName VARCHAR(50) COMMENT '英文姓名',
  age INT UNSIGNED  COMMENT '年龄',
  passport varchar(50) COMMENT '证件号',
  echelonId BIGINT unsigned COMMENT '梯次id, echelon表id',
  tel varchar(50) COMMENT '联络电话',
  email varchar(50) COMMENT 'e-mail',
  alCardVerify int default 0 COMMENT '允许刷卡登陆, 0 不允许, 1允许',
  superiorId BIGINT unsigned default 0 COMMENT '上司的id,user表id',
  lang varchar(50) commnet = 'i18n语言, dict表LANG_TYPE',
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

-- ALTER TABLE user 
-- ADD UNIQUE INDEX `usr_unique`(`deleteAt`, `usr`) USING HASH COMMENT '账号不能重复';

INSERT INTO sysdict(catgroy, memo, dict) VALUES('LANG_TYPE', '用户选择的语言', '["cn","hk","en"]' );

-- 用户唯一、lang 字典约束
CREATE or replace TRIGGER user_usrunique_insertcheck 
BEFORE INSERT ON user FOR EACH ROW
BEGIN
  IF exists(
    select 1 
    from user
    where usr = NEW.usr 
			and id != NEW.id
			and deleteAt is null
  ) THEN
    set @message_text = concat('usr must be unique but ', NEW.usr);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;

  IF checkindictarr('LANG_TYPE', NEW.lang)!=1 THEN
    set @message_text = concat('lang must be in LANG_TYPE dict, but value is ', NEW.lang);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;

END;

CREATE or replace TRIGGER user_usrunique_updatecheck 
BEFORE UPDATE ON user FOR EACH ROW
BEGIN
  IF exists(
    select 1 
    from user
    where usr = NEW.usr 
			and id != NEW.id
			and deleteAt is null
  ) THEN
    set @message_text = concat('usr must be unique but ', NEW.usr);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
  IF checkindictarr('LANG_TYPE', NEW.lang)!=1 THEN
    set @message_text = concat('lang must be in LANG_TYPE dict, but value is ', NEW.lang);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;


# 角色
CREATE or replace TABLE role(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',
  code varchar(50) COMMENT '编号',
  cnName VARCHAR(50) COMMENT '简体姓名',
  hkName VARCHAR(50) COMMENT '繁体姓名',
  enName VARCHAR(50) COMMENT '英文姓名',
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

INSERT INTO role(memo, code, cnName, hkName, enName) VALUES('默认角色', 'SAdmin', '系统管理员', '系統管理員', 'System Administrator');
INSERT INTO role(memo, code, cnName, hkName, enName) VALUES('默认角色', 'Admin', '管理员', '管理員', 'Administrator');
INSERT INTO role(memo, code, cnName, hkName, enName) VALUES('默认角色', 'ScManager', '保安经理', '保安經理', 'Security Manager');
INSERT INTO role(memo, code, cnName, hkName, enName) VALUES('默认角色', 'ScGurad', '保安', '保安', 'Security Gurad');




# 角色模块权限
CREATE OR REPLACE TABLE rolemodule(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',
  	
  	
  code varchar(50) COMMENT '编号',
  cnName VARCHAR(50) COMMENT '简体姓名',
  hkName VARCHAR(50) COMMENT '繁体姓名',
  enName VARCHAR(50) COMMENT '英文姓名',
  color varchar(50) COMMENT '颜色',
  icon varchar(50) COMMENT '图表,icon-emotsmile',
  router varchar(200) COMMENT '路由地址',
  routerParam varchar(500) COMMENT '路由参数',
  module VARCHAR(50) COMMENT '模块',	
  action varchar(200) COMMENT 'action',
  sort INT default 0 COMMENT '排序',
  pid INT DEFAULT 0 COMMENT '父结点',
  	
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

# 机构,组织架构,公司
CREATE OR REPLACE TABLE org(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',
  code varchar(50) COMMENT '编号',
  cnName VARCHAR(50) COMMENT '简体姓名',
  hkName VARCHAR(50) COMMENT '繁体姓名',
  enName VARCHAR(50) COMMENT '英文姓名',
  pid BIGINT UNSIGNED DEFAULT(0) COMMENT '父结点',
  addr varchar(200) DEFAULT(0) COMMENT '地址',
  contactName varchar(100) DEFAULT(0) COMMENT '联络人',
  contactTel varchar(100) DEFAULT(0) COMMENT '联络人电话',
  headName varchar(100) DEFAULT(0) COMMENT '负责人',
  headTel varchar(100) DEFAULT(0) COMMENT '负责人电话',
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

# 群组/group/team
CREATE OR REPLACE TABLE team(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',
  code varchar(50) COMMENT '编号',
  cnName VARCHAR(50) COMMENT '简体姓名',
  hkName VARCHAR(50) COMMENT '繁体姓名',
  enName VARCHAR(50) COMMENT '英文姓名',
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

# 群组人员
CREATE or replace TABLE teamperson(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',

  teamId BIGINT UNSIGNED COMMENT '群组id,对应team表id',
  teamCode varchar(50) COMMENT '冗余, 群组编号',
  userId BIGINT UNSIGNED COMMENT '群组人员id,对应user表id',
  userCode varchar(50) COMMENT '冗余, 人员编号',
  isLeader INT default 0 COMMENT '是否组长,0不是,1是',
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;




# 地点,location,坐标,定位
CREATE or replace TABLE pointer(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',

  orgId BIGINT UNSIGNED COMMENT '机构id,对应org表id',
  orgCode VARCHAR(50) COMMENT '冗余,机构code,对应org表code',
  cnName VARCHAR(50) COMMENT '简体姓名',
  hkName VARCHAR(50) COMMENT '繁体姓名',
  enName VARCHAR(50) COMMENT '英文姓名',
  code VARCHAR(50) COMMENT '编号',

  nearPointer1 BIGINT UNSIGNED COMMENT '邻近点1的id,对应pointer表id',
  nearPointerCode1 VARCHAR(50) COMMENT '邻近点1的编号',
  nearPointer2 BIGINT UNSIGNED COMMENT '邻近点2的id,对应pointer表id',
  nearPointerCode2 VARCHAR(50) COMMENT '邻近点2的编号',
  nearPointer3 BIGINT UNSIGNED COMMENT '邻近点3的id,对应pointer表id',
  nearPointerCode3 VARCHAR(50) COMMENT '邻近点3的编号',
  nearPointer4 BIGINT UNSIGNED COMMENT '邻近点4的id,对应pointer表id',
  nearPointerCode4 VARCHAR(50) COMMENT '邻近点4的编号',
  nearPointer5 BIGINT UNSIGNED COMMENT '邻近点5的id,对应pointer表id',
  nearPointerCode5 VARCHAR(50) COMMENT '邻近点5的编号',

  nfcIds json COMMENT '对应NFC标签的id,json数组[{id}]',
  beaconIds json COMMENT '对应beacon标签的id,json数组[{id,rssi}]',
  beaconLimit int default 0 COMMENT '在beaconIds最少多少个可以确定',

  -- routerId BIGINT UNSIGNED COMMENT '路线id,对应router表id',
  -- routerCode varchar(50) COMMENT '冗余, 路线code,对应router表code',
  -- sort INT default 0 COMMENT '序号, 同一线路routerId,多个点的排序',
  -- minMinute INT default 0 COMMENT '当前点最小到达分钟数',
  -- maxMinute INT default 0 COMMENT '当前点最大到达分钟数',

  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;




# 标签 
CREATE or replace TABLE tag(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',

  orgId BIGINT UNSIGNED COMMENT '机构id,对应org表id',
  orgCode varchar(50) COMMENT '机构code,对应org表code',
  pointerId BIGINT UNSIGNED COMMENT '对应pointer表id',
  pointerCode VARCHAR(50) COMMENT '对应pointer表code',
  	
  tagType varchar(20) COMMENT '标签类型,NFC,Beacon',
  tagId varchar(20) COMMENT '标签id',
  rssi int COMMENT 'Beacon rssi',
  power int COMMENT 'Beacon 电量',
  	
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;


CREATE or replace TRIGGER tag_tagtype_insertcheck 
BEFORE INSERT ON tag FOR EACH ROW
BEGIN
  IF checkindictarr('TAG_TYPE', NEW.tagType)!=1 THEN
    set @message_text = concat('tagType must be in TAG_TYPE dict, but value is ', NEW.tagType);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;

CREATE or replace TRIGGER tag_tagType_updatecheck 
BEFORE UPDATE ON tag FOR EACH ROW
BEGIN
  IF checkindictarr('TAG_TYPE', NEW.tagType)!=1 THEN
    set @message_text = concat('tagType must be in TAG_TYPE dict, but value is ', NEW.tagType);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;



# 巡更路线,由多个pointer构成
CREATE or replace TABLE router(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED NULL DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',

  orgId BIGINT UNSIGNED COMMENT '机构id,对应org表id',
  orgCode varchar(50) COMMENT '冗余, 机构code,对应org表code',
  code VARCHAR(50) COMMENT '编号',
  cnName VARCHAR(50) COMMENT '简体姓名',
  hkName VARCHAR(50) COMMENT '繁体姓名',
  enName VARCHAR(50) COMMENT '英文姓名',
  routerType varchar(20) COMMENT '路线类型,dist.ROUTE_TYPE,fixed, free',
  frequent json COMMENT '一周的周期,用于app选择巡更路线时过滤不需要巡更的,json[0-6]',
  startTime TIMESTAMP not null comment '开始时间',
  endTime TIMESTAMP not null comment '开始时间',

  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

CREATE or replace TRIGGER router_column_insertcheck 
BEFORE INSERT ON router FOR EACH ROW
BEGIN
  IF checkindictarr('ROUTE_TYPE', NEW.routerType)!=1 THEN
    set @message_text = concat('routerType must be in ROUTE_TYPE dict, but value is ', NEW.routerType);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;

CREATE or replace TRIGGER router_column_updatecheck 
BEFORE UPDATE ON router FOR EACH ROW
BEGIN
  IF checkindictarr('ROUTE_TYPE', NEW.routerType)!=1 THEN
    set @message_text = concat('routertype must be in ROUTE_TYPE dict, but value is ', NEW.routerType);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;

-- # 固定路线,由多个pointer构成
CREATE or replace TABLE routerpoint(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',

  orgId BIGINT UNSIGNED COMMENT '冗余,机构id,对应org表id',
  orgCode varchar(50) COMMENT '冗余, 机构code,对应org表code',
  routerId BIGINT UNSIGNED COMMENT '路线id,对应router表id',
  routerCode varchar(50) COMMENT '冗余, 路线code,对应router表code',
  pointerId BIGINT UNSIGNED COMMENT '地标,点的id,对应pointer表id',
  pointerCode varchar(50) COMMENT '冗余, 地标code,对应pointer表code',
  	
  sort INT default 0 COMMENT '序号, 同一线路routerId,多个点的排序',
  minMinute INT default 0 COMMENT '当前点最小到达分钟数',
  maxMinute INT default 0 COMMENT '当前点最大到达分钟数',
  	
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;



# 巡更任务表
CREATE or replace TABLE patrolaction(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',

  orgId BIGINT UNSIGNED COMMENT '冗余,机构id,对应org表id',
  orgCode varchar(50) COMMENT '冗余, 机构code,对应org表code',
  routerId BIGINT UNSIGNED COMMENT '路线id,对应router表id',
  routerCode varchar(50) COMMENT '冗余, 路线code,对应router表code',

  beginTime timestamp COMMENT '巡更开始时间',
  endTime timestamp COMMENT '巡更结束时间',
  situation json COMMENT '状况总结,dict.PATROL_SITUATION,json[skip, fast, slow]',

  userId BIGINT UNSIGNED COMMENT '哪个user的巡逻,对应user表id',
  imei varchar(50) COMMENT 'imei号',
  sim varchar(50) COMMENT 'sim号码',
  ipAddr varchar(50) COMMENT 'ip',

  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

insert into sysdict(catgroy, memo, dict)
values('PATROL_SITUATION', '巡更状况', JSON_ARRAY('skip', 'fast', 'slow'));


# 巡更检查点记录表
CREATE or replace TABLE patrolrecord(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',

  orgId BIGINT UNSIGNED COMMENT '冗余,机构id,对应org表id',
  orgCode varchar(50) COMMENT '冗余, 机构code,对应org表code',
  routerId BIGINT UNSIGNED COMMENT '冗余路线id,对应router表id',
  routerCode varchar(50) COMMENT '冗余, 路线code,对应router表code',
  pactId BIGINT UNSIGNED COMMENT '巡更任务id,对应patrolaction表id',

  pointerId BIGINT UNSIGNED COMMENT '地标,点的id,对应pointer表id',
  pointerCode varchar(50) COMMENT '冗余, 地标code,对应pointer表code',

  nfcId varchar(50) COMMENT '巡更此pointer扫描到的NFC tag id',
  beaconIds json COMMENT '对应beacon标签的id,json数组[{id,rssi}]',
  arrivetime timestamp COMMENT '到达时间',
  # mobileid BIGINT UNSIGNED COMMENT '移动设备id,使用app的id',
  nextpointerId BIGINT UNSIGNED default 0 COMMENT '下一地标的id,对应pointer表id',

  imei varchar(50) COMMENT 'imei号',
  sim varchar(50) COMMENT 'sim号码',
  ipAddr varchar(50) COMMENT 'ip',

  isSkip int COMMENT '是否跳过, 0没有跳过, 1跳过',
  warn json COMMENT '系统warn, dict.PATROLRECORD_WARN, [fast|slow]',
  state varchar(50) COMMENT '状态, dict.PATROLRECORD_STATE',
  cotent varchar(500) COMMENT '巡更文字内容, 如巡更點遺失, 雜物阻礙, 巡更點損壞, app需要自动列出以往的内容选择',
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

# 系统自动计算,目前只有过快和过慢
insert into sysdict(catgroy, memo, dict)
values('PATROLRECORD_WARN', '巡更检查点记录系统警告', JSON_ARRAY('fast', 'slow'));

# 预留后面使用,正常,设备损害需要维修后面可转维修单,安全问题等等
insert into sysdict(catgroy, memo, dict)
values('PATROLRECORD_STATE', '巡更检查点记录状态', JSON_ARRAY('normal', 'abnormal'));


CREATE or replace TRIGGER patrolrecord_state_insertcheck 
BEFORE INSERT ON patrolrecord FOR EACH ROW
BEGIN
  IF checkindictarr('PATROLRECORD_STATE', NEW.state)!=1 THEN
    set @message_text = concat('state must be in PATROLRECORD_STATE dict, but value is ', NEW.state);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;

CREATE or replace TRIGGER patrolrecord_state_updatecheck 
BEFORE UPDATE ON patrolrecord FOR EACH ROW
BEGIN
  IF checkindictarr('PATROLRECORD_STATE', NEW.state)!=1 THEN
    set @message_text = concat('state must be in PATROLRECORD_STATE dict, but value is ', NEW.state);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;


# 巡更检查点记录附件表
CREATE or replace TABLE patrolrecordacc(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',

  orgId BIGINT UNSIGNED COMMENT '冗余,机构id,对应org表id',
  orgCode varchar(50) COMMENT '冗余, 机构code,对应org表code',
  routerId BIGINT UNSIGNED COMMENT '冗余路线id,对应router表id',
  routerCode varchar(50) COMMENT '冗余, 路线code,对应router表code',
  pactId BIGINT UNSIGNED COMMENT '冗余巡更任务id,对应patrolaction表id',

  pointerId BIGINT UNSIGNED COMMENT '冗余地标,点的id,对应pointer表id',
  pointerCode varchar(50) COMMENT '冗余, 地标code,对应pointer表code',

  imei varchar(50) COMMENT 'imei号',
  sim varchar(50) COMMENT 'sim号码',
  ipAddr varchar(50) COMMENT 'ip',

  prId BIGINT UNSIGNED default 0 COMMENT '外键,对应patrolrecord表id',

  accType varchar(20) COMMENT '附件类型, dict.PATROLRECORDACC_ACCTYPE, pic, voice, video',
  prePath varchar(200) COMMENT '附件路径前缀',
  relPath varchar(200) COMMENT '附件相对路径',
  cotent varchar(500) COMMENT '可以对附件附加描述',
  ext varchar(20) COMMENT '附件扩展名,如 png, mp4',
  fileName varchar(50) COMMENT '附件名',
  fileSize BIGINT unsigned COMMENT '附件size',
  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

# 附件类型
insert into sysdict(catgroy, memo, dict)
values('PATROLRECORDACC_ACCTYPE', '巡更检查点记录附件类型', JSON_ARRAY('pic', 'voice', 'video'));


CREATE or replace TRIGGER patrolrecordacc_accType_insertcheck 
BEFORE INSERT ON patrolrecordacc FOR EACH ROW
BEGIN
  IF checkindictarr('PATROLRECORDACC_ACCTYPE', NEW.accType)!=1 THEN
    set @message_text = concat('accType must be in PATROLRECORDACC_ACCTYPE dict, but value is ', NEW.accType);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;

CREATE or replace TRIGGER patrolrecordacc_accType_updatecheck 
BEFORE UPDATE ON patrolrecordacc FOR EACH ROW
BEGIN
  IF checkindictarr('PATROLRECORDACC_ACCTYPE', NEW.accType)!=1 THEN
    set @message_text = concat('accType must be in PATROLRECORDACC_ACCTYPE dict, but value is ', NEW.accType);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;



# 设备管理
CREATE or replace TABLE device(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',

  orgId json COMMENT '机构id,对应org表id',
  orgCode varchar(50) COMMENT '冗余, 机构code,对应org表code',
  # routerId BIGINT UNSIGNED COMMENT '冗余路线id,对应router表id',
  # routerCode varchar(50) COMMENT '冗余, 路线code,对应router表code',
  # pactId BIGINT UNSIGNED COMMENT '冗余巡更任务id,对应patrolaction表id',

  imei varchar(50) COMMENT 'imei号',
  sim varchar(50) COMMENT 'sim号码',
  mac varchar(50) COMMENT 'mac地址',
  
  latestUserId  BIGINT UNSIGNED COMMENT '最近用户id,对应user表id',
  latestUserCode varchar(50) COMMENT '最近用户code,对应user表code',


  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;



# 消息管理
CREATE or replace TABLE msg(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',

  orgId BIGINT UNSIGNED COMMENT '机构id,对应org表id',
  orgCode varchar(50) COMMENT '冗余, 机构code,对应org表code',
  # routerId BIGINT UNSIGNED COMMENT '冗余路线id,对应router表id',
  # routerCode varchar(50) COMMENT '冗余, 路线code,对应router表code',
  # pactId BIGINT UNSIGNED COMMENT '冗余巡更任务id,对应patrolaction表id',

  imei varchar(50) COMMENT 'imei号',
  sim varchar(50) COMMENT 'sim号码',
  ipAddr varchar(50) COMMENT 'ip',


  fromUserId BIGINT UNSIGNED COMMENT '发送的用户id,对应user表id',
  fromUserCode varchar(50) COMMENT '冗余发送的用户code,对应user表code',
  toUserId BIGINT UNSIGNED COMMENT '接收用户id,对应user或group表id',
  toUserCode varchar(50) COMMENT '冗余接收用户code,对应user或group表code',

  msgType varchar(20) COMMENT '消息类型, dict.MSG_TYPE',
  msgStyle varchar(20) COMMENT '消息形态, dict.MSG_STYLE',

  content varchar(500) COMMENT '文字消息,当 msgStyle == text',
  prePath varchar(200) COMMENT '附件路径前缀',
  relPath varchar(200) COMMENT '附件相对路径',
  cotent varchar(200) COMMENT '可以对附件附加描述',
  ext varchar(20) COMMENT '附件扩展名,如 png, mp4',
  fileName varchar(50) COMMENT '附件名',
  fileSize BIGINT unsigned COMMENT '附件size',

  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;

# 消息类型
insert into sysdict(catgroy, memo, dict)
values('MSG_TYPE', '消息类型', JSON_ARRAY('member','group'));

# 消息形态
insert into sysdict(catgroy, memo, dict)
values('MSG_STYLE', '消息形态', JSON_ARRAY('text', 'pic', 'voice', 'video'));


CREATE or replace TRIGGER msg_msgType_msgStyle_insertcheck 
BEFORE INSERT ON msg FOR EACH ROW
BEGIN
  IF checkindictarr('MSG_TYPE', NEW.msgType)!=1 THEN
    set @message_text = concat('msgType must be in MSG_TYPE dict, but value is ', NEW.msgType);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
  IF checkindictarr('MSG_STYLE', NEW.msgStyle)!=1 THEN
    set @message_text = concat('msgStyle must be in MSG_STYLE dict, but value is ', NEW.msgStyle);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;

CREATE or replace TRIGGER msg_msgType_msgStyle_updatecheck 
BEFORE UPDATE ON msg FOR EACH ROW
BEGIN
  IF checkindictarr('MSG_TYPE', NEW.msgType)!=1 THEN
    set @message_text = concat('msgType must be in MSG_TYPE dict, but value is ', NEW.msgType);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
  IF checkindictarr('MSG_STYLE', NEW.msgStyle)!=1 THEN
    set @message_text = concat('msgStyle must be in MSG_STYLE dict, but value is ', NEW.msgStyle);
    signal sqlstate '45000' set MESSAGE_TEXT = @message_text;
  END IF;
END;





# 救命钟
create or replace table sos(
  id BIGINT unsigned default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',

  fromUserId BIGINT UNSIGNED COMMENT '发送的用户id,对应user表id',
  fromUserCode varchar(50) COMMENT '冗余发送的用户code,对应user表code',

  endTime timestamp COMMENT '结束时间',
  endBy BIGINT UNSIGNED COMMENT '结束人id',
  endByCode BIGINT UNSIGNED COMMENT '结束人id',

  content varchar(200) COMMENT '求救内容,如:測試保安員保安，在测试点1Beacon巡更點，提交了救命鐘請求！請迅速救援！',

  imei varchar(50) COMMENT 'imei号',
  sim varchar(50) COMMENT 'sim号码',
  ipAddr varchar(50) COMMENT 'ip',

  PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4;





#2020-09-03
ALTER TABLE `ipatrol`.`patrolaction` 
ADD COLUMN `userId` bigint(20) NULL COMMENT '哪个user的巡逻,对应user表id' AFTER `situation`;


#2020-08-20
ALTER TABLE `ipatrol`.`user` 
ADD COLUMN `roleCode` varchar(50) COMMENT '冗余发送的角色的code,对应role表code';

#2020-08-25
ALTER TABLE `ipatrol`.`device` 
CHANGE COLUMN `orgId` `orgIds` json NULL COMMENT 'json数组的机构id,对应org表id' AFTER `memo`,
CHANGE COLUMN `orgCode` `orgCodes` json NULL COMMENT '冗余, 机构code,对应org表code' AFTER `orgIds`,
ADD COLUMN `state` int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结';


# 设置设备的orgIds授权的NFC
create table setdevicenfc(
  id BIGINT unsigned primary key default(uuid_short()) COMMENT '主键',
  insertAt timestamp DEFAULT(CURRENT_TIMESTAMP) INVISIBLE COMMENT '新增时间',
  updateAt timestamp NULL ON UPDATE CURRENT_TIMESTAMP INVISIBLE COMMENT '更新时间',
  deleteAt timestamp NULL INVISIBLE COMMENT '删除时间',
  insertBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '新增人,user表id,0 代表系统操作或数据库直接操作',
  updateBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '更新人,user表id,0 代表系统操作或数据库直接操作',
  deleteBy BIGINT UNSIGNED DEFAULT 0 INVISIBLE COMMENT '删除人,user表id,0 代表系统操作或数据库直接操作',
  insertByCode varchar(50) INVISIBLE COMMENT '冗余,新增人,user表code',
  updateByCode varchar(50) INVISIBLE COMMENT '冗余,更新人,user表code',
  deleteByCode varchar(50) INVISIBLE COMMENT '冗余,删除人,user表code',
  memo varchar(200) COMMENT '备注',
  state int default 1 COMMENT '状态 0待审核, 1正常/使用, 2停用/冻结',
  tagId varchar(50) COMMENT 'NFC标签ID',
  orgIds json COMMENT 'json数组,设置所属机构,集团机构'
)

# 报表订阅,先研究下 jasperreport 看看需要什么参数字段等


# 排班表 dutyroster
# 梯次 echelon 
