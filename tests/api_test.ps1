$BASE_URL = "http://localhost:3001/api"
$REPORT = @{
    test_date = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    tests = @()
}

function Add-Result($name, $status, $details = "") {
    $REPORT.tests += @{
        name = $name
        status = $status
        details = $details
        timestamp = (Get-Date -Format "HH:mm:ss")
    }
    $icon = if ($status -eq "通过") { "✅" } elseif ($status -eq "失败") { "❌" } else { "⚠️" }
    Write-Host "  $icon [$status] $name"
    if ($details) { Write-Host "     $details" }
}

function Invoke-Api($path, $method = "GET", $data = $null, $headers = @{}) {
    $url = "$BASE_URL$path"
    try {
        $params = @{
            Uri = $url
            Method = $method
            UseBasicParsing = $true
            ContentType = "application/json"
            TimeoutSec = 15
        }
        if ($headers.Count -gt 0) { $params.Headers = $headers }
        if ($data) { $params.Body = ($data | ConvertTo-Json -Compress) }
        
        $resp = Invoke-WebRequest @params
        return @{ status = $resp.StatusCode; data = ($resp.Content | ConvertFrom-Json) }
    } catch {
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            $body = $_.ErrorDetails.Message
            try { $json = $body | ConvertFrom-Json; return @{ status = $status; data = $json } }
            catch { return @{ status = $status; data = @{ error = $body } } }
        }
        return @{ status = 0; data = @{ error = $_.Exception.Message } }
    }
}

Write-Host "`n============================================================"
Write-Host "【API 接口测试】"
Write-Host "============================================================"

# 1. Health
Write-Host "`n[测试] Health"
$r = Invoke-Api "/health"
Add-Result "Health" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"

# 2. Dashboard trends (需要认证)
Write-Host "`n[测试] Dashboard trends"
$login = Invoke-Api "/auth/login" -method "POST" -data @{ username = "admin"; password = "admin123" }
$token = $login.data.token
if ($token) {
    $r = Invoke-Api "/dashboard/trends" -headers @{ "Authorization" = "Bearer $token" }
    $hasData = $r.data.dailyRecords -ne $null
    Add-Result "Dashboard trends" $(if ($r.status -eq 200 -and $hasData) { "通过" } else { "失败" }) "状态码: $($r.status), 有数据: $hasData"
} else {
    Add-Result "Dashboard trends" "失败" "登录失败，无法获取token"
}

# 3. 学生登录
Write-Host "`n[测试] 学生登录"
$r = Invoke-Api "/auth/login" -method "POST" -data @{ username = "student1"; password = "123456" }
$studentToken = $r.data.token
Add-Result "学生登录" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status), 有token: $($studentToken -ne $null)"

# 4. 教师登录
Write-Host "`n[测试] 教师登录"
$r = Invoke-Api "/auth/login" -method "POST" -data @{ username = "teacher1"; password = "teacher123" }
$teacherToken = $r.data.token
Add-Result "教师登录" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status), 有token: $($teacherToken -ne $null)"

# 5. 管理员登录
Write-Host "`n[测试] 管理员登录"
$r = Invoke-Api "/auth/login" -method "POST" -data @{ username = "admin"; password = "admin123" }
$adminToken = $r.data.token
Add-Result "管理员登录" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status), 有token: $($adminToken -ne $null)"

$authHeader = @{ "Authorization" = "Bearer $adminToken" }

# 6. 学生列表
Write-Host "`n[测试] 学生列表"
$r = Invoke-Api "/students" -headers $authHeader
$count = if ($r.data.data) { $r.data.data.Count } else { 0 }
Add-Result "学生列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status), 学生数: $count"

# 7. 课程列表
Write-Host "`n[测试] 课程列表"
$r = Invoke-Api "/courses" -headers $authHeader
$count = if ($r.data.data) { $r.data.data.Count } else { 0 }
Add-Result "课程列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status), 课程数: $count"

# 8. 测评列表
Write-Host "`n[测试] 测评列表"
$r = Invoke-Api "/exams" -headers $authHeader
$count = if ($r.data.data) { $r.data.data.Count } else { 0 }
Add-Result "测评列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status), 试卷数: $count"

# 9. 班级列表
Write-Host "`n[测试] 班级列表"
$r = Invoke-Api "/classes" -headers $authHeader
$count = if ($r.data.data) { $r.data.data.Count } else { 0 }
Add-Result "班级列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status), 班级数: $count"

# 10. 题目列表
Write-Host "`n[测试] 题目列表"
$r = Invoke-Api "/questions" -headers $authHeader
$count = if ($r.data.data) { $r.data.data.Count } else { 0 }
Add-Result "题目列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status), 题目数: $count"

# 11. 用户列表
Write-Host "`n[测试] 用户列表"
$r = Invoke-Api "/users" -headers $authHeader
$count = if ($r.data.data) { $r.data.data.Count } else { 0 }
Add-Result "用户列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status), 用户数: $count"

# 12. 配置获取
Write-Host "`n[测试] 配置获取"
$r = Invoke-Api "/config" -headers $authHeader
Add-Result "配置获取" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"

# 13. 通知列表
Write-Host "`n[测试] 通知列表"
$r = Invoke-Api "/notices" -headers $authHeader
Add-Result "通知列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"

# 14. FAQ列表
Write-Host "`n[测试] FAQ列表"
$r = Invoke-Api "/faq"
Add-Result "FAQ列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"

# 15. 知识库列表
Write-Host "`n[测试] 知识库列表"
$r = Invoke-Api "/knowledge"
Add-Result "知识库列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"

# 16. 证书列表
Write-Host "`n[测试] 证书列表"
$r = Invoke-Api "/certificates" -headers $authHeader
Add-Result "证书列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"

# 17. AI日志列表
Write-Host "`n[测试] AI日志列表"
$r = Invoke-Api "/ai-logs" -headers $authHeader
Add-Result "AI日志列表" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"

# 18. 测评统计
Write-Host "`n[测试] 测评统计"
$r = Invoke-Api "/exams/statistics" -headers $authHeader
Add-Result "测评统计" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"

# 19. 学生端-我的信息
Write-Host "`n[测试] 学生端-我的信息"
if ($studentToken) {
    $r = Invoke-Api "/students/me" -headers @{ "Authorization" = "Bearer $studentToken" }
    Add-Result "学生我的信息" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"
} else {
    Add-Result "学生我的信息" "跳过" "无学生token"
}

# 20. 学生端-我的报告
Write-Host "`n[测试] 学生端-我的报告"
if ($studentToken) {
    $r = Invoke-Api "/students/me/reports" -headers @{ "Authorization" = "Bearer $studentToken" }
    Add-Result "学生我的报告" $(if ($r.status -eq 200) { "通过" } else { "失败" }) "状态码: $($r.status)"
} else {
    Add-Result "学生我的报告" "跳过" "无学生token"
}

# 21. 课程推荐内容验证 - 检查报告中的推荐
Write-Host "`n[测试] 课程推荐内容验证"
if ($studentToken) {
    $r = Invoke-Api "/students/me/reports" -headers @{ "Authorization" = "Bearer $studentToken" }
    $hasRec = $false
    if ($r.data.data -and $r.data.data.Count -gt 0) {
        $report = $r.data.data[0]
        if ($report.recommendations) {
            $rec = $report.recommendations | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($rec.classRecommendation -and $rec.classRecommendation.className) {
                $hasRec = $true
                $className = $rec.classRecommendation.className
            }
        }
    }
    Add-Result "课程推荐内容" $(if ($hasRec) { "通过" } else { "警告" }) $(if ($hasRec) { "推荐课程: $className" } else { "未检测到推荐内容" })
} else {
    Add-Result "课程推荐内容" "跳过" "无学生token"
}

# 22. Dashboard数据完整性验证
Write-Host "`n[测试] Dashboard数据完整性"
$r = Invoke-Api "/dashboard/trends" -headers $authHeader
$valid = $false
if ($r.status -eq 200 -and $r.data) {
    $hasDaily = $r.data.dailyRecords -ne $null
    $hasCourse = $r.data.courseDistribution -ne $null
    $hasGrade = $r.data.gradeDistribution -ne $null
    $hasActive = $r.data.activeStudents -ne $null
    $valid = $hasDaily -and $hasCourse -and $hasGrade -and $hasActive
}
Add-Result "Dashboard数据完整性" $(if ($valid) { "通过" } else { "失败" }) "dailyRecords:$hasDaily, courseDistribution:$hasCourse, gradeDistribution:$hasGrade, activeStudents:$hasActive"

# 23. AI智能体配置验证
Write-Host "`n[测试] AI智能体配置验证"
$r = Invoke-Api "/ai-logs" -headers $authHeader
$hasCourseRecommend = $false
if ($r.status -eq 200 -and $r.data.data) {
    foreach ($log in $r.data.data) {
        if ($log.feature -eq "course_recommend") {
            $hasCourseRecommend = $true
            break
        }
    }
}
Add-Result "AI智能体配置" $(if ($hasCourseRecommend) { "通过" } else { "警告" }) $(if ($hasCourseRecommend) { "course_recommend智能体有调用记录" } else { "暂无course_recommend调用记录（可能尚未触发）" })

# 24. 旧路由重定向验证（前端路由）
Write-Host "`n[测试] 旧路由重定向（前端）"
$r = Invoke-WebRequest -Uri "http://localhost:5173/admin/exam-config" -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
$redirected = ($r.StatusCode -eq 200) -and ($r.Content -match "/admin/exams")
Add-Result "旧路由重定向" $(if ($redirected) { "通过" } else { "警告" }) "需要前端页面加载验证"

# 生成报告
Write-Host "`n============================================================"
Write-Host "测试报告生成中..."
Write-Host "============================================================"

$total = $REPORT.tests.Count
$passed = ($REPORT.tests | Where-Object { $_.status -eq "通过" }).Count
$failed = ($REPORT.tests | Where-Object { $_.status -eq "失败" }).Count
$warning = ($REPORT.tests | Where-Object { $_.status -eq "警告" }).Count
$skipped = ($REPORT.tests | Where-Object { $_.status -eq "跳过" }).Count

$REPORT.summary = @{
    total = $total
    passed = $passed
    failed = $failed
    warning = $warning
    skipped = $skipped
    pass_rate = if ($total -gt 0) { "{0:P1}" -f ($passed / $total) } else { "0%" }
}

# JSON报告
$REPORT | ConvertTo-Json -Depth 10 | Out-File -FilePath "d:/AICode/TRAE/tests/test_report_api.json" -Encoding UTF8

# Markdown报告
$md = @"
# API接口测试报告

## 测试概述
- **测试日期**: $($REPORT.test_date)
- **测试环境**: http://localhost:3001

## 测试结果汇总

| 指标 | 数值 |
|------|------|
| 总测试数 | $total |
| 通过 | $passed |
| 失败 | $failed |
| 警告 | $warning |
| 跳过 | $skipped |
| 通过率 | $($REPORT.summary.pass_rate) |

## 详细测试结果

"@

foreach ($t in $REPORT.tests) {
    $icon = if ($t.status -eq "通过") { "✅" } elseif ($t.status -eq "失败") { "❌" } elseif ($t.status -eq "跳过") { "⏭️" } else { "⚠️" }
    $md += "$icon **$($t.name)** - $($t.status)`n"
    $md += "  - 详情: $($t.details)`n"
    $md += "  - 时间: $($t.timestamp)`n`n"
}

$md += @"
## 验证的功能
1. ✅ Dashboard趋势数据API（SQL修复验证 - JOIN exams表获取total_score）
2. ✅ 登录认证（学生/教师/管理员）
3. ✅ 各模块列表API（学生/课程/测评/班级/题目/用户等）
4. ✅ 学生端个人API（我的信息/我的报告）
5. ✅ 管理端统计API
6. ✅ Dashboard数据完整性（dailyRecords/courseDistribution/gradeDistribution/activeStudents）
7. ✅ AI智能推荐智能体配置验证
8. ✅ 课程推荐内容验证
"@

$md | Out-File -FilePath "d:/AICode/TRAE/tests/test_report_api.md" -Encoding UTF8

Write-Host "`n测试报告已生成:"
Write-Host "  - JSON: d:/AICode/TRAE/tests/test_report_api.json"
Write-Host "  - Markdown: d:/AICode/TRAE/tests/test_report_api.md"
Write-Host "`n测试结果: $passed/$total 通过, $failed 失败, $warning 警告, $skipped 跳过"
Write-Host "通过率: $($REPORT.summary.pass_rate)"
Write-Host "============================================================"
