# QMX - Qwen Multi-agent eXtension

> Qwen Code CLI 的多智能体编排层

[![npm version](https://img.shields.io/npm/v/qmx.svg)](https://www.npmjs.com/package/qmx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[English](README.md)** | **简体中文** | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md)

## 🚀 快速开始

```bash
# 全局安装
npm install -g qmx

# 设置项目
qmx setup

# 检查安装
qmx doctor

# 启动 QMX
qmx
```

## ✨ 功能特性

### 🎭 基于角色的智能体 (30+)

通过 `/prompts:name` 命令访问专业智能体：

- `/prompts:architect` - 系统设计和架构审查
- `/prompts:planner` - 任务分解和规划
- `/prompts:executor` - 实现和代码生成
- `/prompts:debugger` - 调试和修复
- `/prompts:reviewer` - 代码审查
- `/prompts:security` - 安全审计

### ⚡ 工作流技能 (40+)

使用 `$name` 语法触发工作流：

- `$plan` - 分解复杂任务
- `$team` - 启动并行智能体团队
- `$review` - 全面代码审查
- `$test` - 生成测试
- `$refactor` - 安全重构

### 🏢 团队编排

```bash
# 从终端
qmx team 4:executor "并行化多模块重构"
qmx team status my-team
qmx team shutdown my-team

# 在 Qwen Code 内
$team 3:reviewer "审查所有 PR 更改"
```

### 🔌 钩子扩展系统

```bash
# 初始化钩子目录
qmx hooks init

# 检查钩子状态
qmx hooks status

# 验证钩子插件
qmx hooks validate
```

## 📦 安装

### 要求

- **操作系统:** macOS, Linux, 或 Windows (通过 WSL2)
- **Node.js:** >= 20.0.0
- **Qwen Code CLI:** 已安装并认证
- **tmux:** 团队模式需要 (v3.0+)

### 快速安装

```bash
npm install -g qmx
qmx setup
qmx doctor
```

## 📖 使用

### 启动命令

```bash
# 标准启动
qmx

# 带推理强度
qmx --high        # 高推理强度
qmx --xhigh       # 超高推理强度

# YOLO 模式（绕过审批）
qmx --yolo
```

### 在 Qwen Code 内

```bash
# 使用专业智能体
/prompts:architect "分析当前认证边界"
/prompts:executor "在登录中实现输入验证"

# 触发工作流技能
$plan "安全地发布 OAuth 回调"
$team 3:executor "修复所有 TypeScript 错误"
```

## 📁 项目结构

```
qmx/
├── bin/qmx.js              # CLI 入口
├── src/                    # 源代码
│   ├── cli/               # CLI 命令
│   ├── team/              # 团队编排
│   ├── mcp/               # MCP 服务器
│   └── hooks/             # 钩子系统
├── prompts/               # 30 个智能体提示
├── skills/                # 40 个工作流技能
└── docs/                  # 文档
```

## 🤝 贡献

我们欢迎贡献！查看 [CONTRIBUTING.md](CONTRIBUTING.md) 获取指南。

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 获取详情。

## 🙏 致谢

- 灵感来自 [oh-my-claudecode](https://github.com/oh-my-claudecode/oh-my-claudecode)
- 为 Qwen Code 社区构建

---

**为 Qwen Code 社区打造** ❤️
