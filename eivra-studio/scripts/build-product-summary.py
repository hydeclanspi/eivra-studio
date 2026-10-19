"""Generate the current one-page product summary (requires reportlab)."""
import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

APP = Path(__file__).resolve().parents[1]
OUTPUT = APP / "output/pdf/eivra-app-summary-1page-zh.pdf"
FONT_PATH = Path(os.environ.get("EIVRA_CJK_FONT", "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"))
if FONT_PATH.is_file():
    pdfmetrics.registerFont(TTFont("EivraCJK", str(FONT_PATH)))
    FONT = "EivraCJK"
else:
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    FONT = "STSong-Light"

body = ParagraphStyle("body", fontName=FONT, fontSize=10, leading=16, textColor=colors.HexColor("#344054"), wordWrap="CJK", spaceAfter=7)
section = ParagraphStyle("section", parent=body, fontSize=12, leading=18, textColor=colors.HexColor("#132e4b"), spaceBefore=11, spaceAfter=6)
small = ParagraphStyle("small", parent=body, fontSize=8, leading=12, textColor=colors.HexColor("#667085"))
title = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=29, leading=34, textColor=colors.HexColor("#132e4b"))
tagline = ParagraphStyle("tagline", fontName="Helvetica", fontSize=12, leading=20, textColor=colors.HexColor("#356b9a"))

story = [Paragraph("Eivra Studio", title), Paragraph("Intuition, calibrated.", tagline), Spacer(1, 9),
         Paragraph("面向不确定性决策的量化研究工作台", section),
         Paragraph("将主观判断转化为可追溯的预测、配置、结果与修正记录。当前研究对象为足球赛事的离散结果，系统围绕概率校准、风险配置与实证检验组织工作。", body),
         HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#dce5ee")),
         Paragraph("研究闭环", section),
         Paragraph("形成判断 → 记录预测 → 配置风险 → 结算结果 → 诊断表现 → 重新校准", body),
         Paragraph("New / Portfolio / Settle 贯穿决策流程；Dashboard、Analysis &amp; Metrics、Seasons 与 History 支持资金追踪、表现切片和周期复盘。", body),
         Paragraph("模型内核", section),
         Paragraph("概率：回归、PAV 保序校准与经验贝叶斯收缩；使用 Brier 评分、对数损失及时间顺序验证检查预测。<br/>风险：分数凯利建议仓位、配置上限、集中度惩罚与组合筛选。<br/>模拟：带固定随机种子的蒙特卡洛模拟，共享事件抽样保留同一比赛相关头寸之间的关系。<br/>证据：滚动前推与预测序贯评估，明确预测来源、信息可用时间与不可靠估计的不可用状态。", body),
         Paragraph("工程与数据", section),
         Paragraph("React 18 / Vite 5 / Tailwind CSS 3 / Web Workers / Vitest。核心分析在浏览器执行；可选服务包括 Git 加密快照、Supabase 历史快照与服务端 AI 解析。", body),
         Paragraph("数据默认本地优先。新名称通过兼容层读取旧存储、会话和备份；图形 Logo 保留原件。旧代码已冻结归档，正式应用位于 eivra-studio/。", body),
         Paragraph("本地运行", section),
         Paragraph("Node.js 20+。克隆仓库后进入 eivra-studio/eivra-studio，执行 npm ci 和 npm run dev；默认地址为 http://localhost:3000。云同步与 AI 解析需单独配置。", body),
         Paragraph("研究边界", section),
         Paragraph("FGM Copula / Shapley 依赖诊断属于探索性代理指数，不代表已校准的尾部概率或因果风险贡献。测试通过不证明预测能力或投资回报。本项目为独立研究与作品集项目，分析不构成投资建议。", small),
         Spacer(1, 12), HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#dce5ee")), Spacer(1, 9),
         Paragraph("hydeclanspi · github.com/hydeclanspi/eivra-studio<br/>在线工作台：hydeclanspi.vercel.app · 完整中英说明见仓库 README", small)]

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=45, leftMargin=45, topMargin=38, bottomMargin=34,
                  title="Eivra Studio - Product Summary", author="hydeclanspi").build(story)
print(OUTPUT)
