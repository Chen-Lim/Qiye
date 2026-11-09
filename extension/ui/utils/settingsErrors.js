/** Translate validation failures without changing the background's input rules. */
export function settingsErrorMessage(error, action = '保存') {
  const message = String(error?.message || error);
  const prefix = action === '添加' ? '未添加' : '未保存';
  if (/invalid host|host must be a string/.test(message)) {
    const wildcard = message.includes('host rule') ? '；也支持 *.example.com' : '';
    return `${prefix}：请填写域名，例如 workspace.feishu.cn${wildcard}。不要包含 https:// 或 /wiki/ 等路径。`;
  }
  if (message.includes('budget must')) return `${prefix}：每日预算请填写大于 0 的分钟数，或留空。`;
  if (message.includes('invalid category color')) return `${prefix}：颜色请使用六位十六进制格式，例如 #B98593。`;
  if (message.includes('unknown category')) return `${prefix}：该分类已不存在，请重新选择。`;
  if (/invalid .*id/.test(message)) return `${prefix}：ID 请以字母或数字开头，使用字母、数字、下划线或短横线，最多 64 位。`;
  if (/invalid .*name/.test(message)) return `${prefix}：请填写有效的名称。`;
  return `${prefix}：操作未完成，请重试。`;
}
