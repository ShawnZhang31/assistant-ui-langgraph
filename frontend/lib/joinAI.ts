import crypto from 'crypto'

/**
 * 生成请求鉴权 headers
 * @param appId 应用 ID
 * @param appSecret 应用密钥
 * @param host 请求的主机名或 IP
 * @returns 包含 authorization, date, host, appId 的 headers 对象
 */
export function createHeaders(
  appId: string,
  appSecret: string,
  host: string
): Record<string, string> {
  // 生成 RFC1123 格式的时间字符串，例如: "Mon, 30 Jun 2025 12:34:56 GMT"
  const date = new Date().toUTCString()

  // 按照规范拼接待签名的原始字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\n`

  // 使用 HMAC-SHA256 算法计算签名
  const hmac = crypto.createHmac('sha256', appSecret)
  hmac.update(signatureOrigin, 'utf8')
  const signatureSha = hmac.digest()

  // 将签名转为 Base64
  const signatureShaBase64 = signatureSha.toString('base64')

  // 拼接 Authorization 头
  const authorization = [
    `hmac api_key=${appId}`,
    `algorithm=hmac-sha256`,
    `headers=host date request-line`,
    `signature=${signatureShaBase64}`
  ].join(', ')

  return {
    "authorization": authorization,
    "date": date,
    "host": host,
    "appId": appId
  }
}

// // 如果直接用 node 执行该文件，可以启用下面这段“main”示例
// if (require.main === module) {
//   const appId = 'YOUR_APP_ID'
//   const appSecret = 'YOUR_APP_SECRET'
//   const host = 'example.com'

//   const headers = createHeaders(appId, appSecret, host)
//   console.log(JSON.stringify(headers, null, 2))
// }
