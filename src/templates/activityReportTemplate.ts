/** Kaoni MHT 스타일 래퍼 — 플레이스홀더만 치환 */

export const ACTIVITY_REPORT_OUTER = `<table cellspacing="0" cellpadding="0" style="width:644px;margin:0;">
<tbody>
<tr>
<td style="border-image: none" height="18" width="644">
<table style="FONT-SIZE: 10pt; HEIGHT: 289px; FONT-FAMILY: 맑은 고딕; WIDTH: 640px; BORDER-COLLAPSE: collapse" cellspacing="0" cellpadding="1">
<tbody>
<tr>
<td id="body" style="BORDER-TOP: rgb(0,0,0) 1px solid; BORDER-RIGHT: rgb(0,0,0) 1px solid; BORDER-BOTTOM: rgb(0,0,0) 1px solid; TEXT-ALIGN: left; BORDER-LEFT: rgb(0,0,0) 1px solid" height="289" valign="top" width="636">
<div style="FONT-SIZE: 14px; FONT-FAMILY: 'Malgun Gothic', '맑은 고딕', sans-serif">
<div style="FONT-SIZE: 10pt; MARGIN-TOP: 5px; TEXT-ALIGN: left">
<div style="FONT-SIZE: 14px; FONT-FAMILY: 'Malgun Gothic', '맑은 고딕', sans-serif">
<p>1. 회비 입출금내역</p>
<p></p>
<table style="FONT-SIZE: 10pt; BORDER-COLLAPSE: collapse; MARGIN-LEFT: 0px" cellspacing="0" cellpadding="1">
<tbody>
{{FEE_TABLE_ROWS}}
</tbody></table>
<p><br></p>
<p></p>
<p>2. 활동내역(1건씩 작성/영수증 반드시 첨부)</p>
<p></p>
{{ACTIVITY_TABLES}}
</div></div></div></td></tr></tbody></table>
</td></tr></tbody></table>`;
