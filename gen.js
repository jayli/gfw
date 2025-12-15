// gen.js
const https = require('https');
const fs = require('fs');
const path = require('path');

async function fetchAwsIpRanges() {
  return new Promise((resolve, reject) => {
    const url = 'https://ip-ranges.amazonaws.com/ip-ranges.json';
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function downloadGfwList() {
  return new Promise((resolve, reject) => {
    const url = 'https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/gfw.txt';
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function saveGfwList() {
  try {
    const gfwData = await downloadGfwList();
    
    // 确保目标目录存在
    const outputPath = path.resolve(__dirname, './data');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    // 写入文件
    const outputFile = path.join(outputPath, 'gfw');
    fs.writeFileSync(outputFile, gfwData);
    
    console.log(`成功下载并保存GFW列表到: ${outputFile}`);
  } catch (error) {
    console.error('下载GFW列表过程中出错:', error.message);
  }
}

async function generateAwsDomains() {
  try {
    // 获取 AWS IP ranges 数据
    const awsData = await fetchAwsIpRanges();
    
    // 提取 regions 并生成域名
    const domains = new Set(); // 使用 Set 自动去重
    
    if (awsData.prefixes && Array.isArray(awsData.prefixes)) {
      awsData.prefixes.forEach(prefix => {
        if (prefix.region) {
          // 使用 region 作为前缀，拼接固定后缀
          const domain = `${prefix.region}.compute.amazonaws.com`;
          domains.add(domain);
        }
      });
    }
    
    // 转换为数组并排序（可选）
    const sortedDomains = Array.from(domains).sort();
    
    // 确保目标目录存在
    const outputPath = path.resolve(__dirname, './data');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    // 写入文件
    const outputFile = path.join(outputPath, 'aws-all');
    fs.writeFileSync(outputFile, sortedDomains.join('\n') + '\n');
    
    console.log(`成功生成文件: ${outputFile}`);
    console.log(`共 ${sortedDomains.length} 条唯一记录`);
    
  } catch (error) {
    console.error('处理过程中出错:', error.message);
  }
}

// 新增功能：提取 us-* 地区的 IP 前缀
async function generateAwsUsIpPrefixes() {
  try {
    // 获取 AWS IP ranges 数据
    const awsData = await fetchAwsIpRanges();
    
    // 提取 region 前缀为 "us-" 的 ip_prefix
    const ipPrefixes = new Set(); // 使用 Set 自动去重
    
    if (awsData.prefixes && Array.isArray(awsData.prefixes)) {
      awsData.prefixes.forEach(prefix => {
        if (prefix.region && prefix.region.startsWith('us-') && prefix.ip_prefix) {
          ipPrefixes.add(prefix.ip_prefix);
        }
      });
    }
    
    // 转换为数组并排序（可选）
    const sortedIpPrefixes = Array.from(ipPrefixes).sort();
    
    // 确保目标目录存在
    const outputPath = path.resolve(__dirname, './ip');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    // 写入文件
    const outputFile = path.join(outputPath, 'aws-us');
    fs.writeFileSync(outputFile, sortedIpPrefixes.join('\n') + '\n');
    
    console.log(`成功生成文件: ${outputFile}`);
    console.log(`共 ${sortedIpPrefixes.length} 条唯一记录`);
    
  } catch (error) {
    console.error('处理过程中出错:', error.message);
  }
}

// 执行函数
async function main() {
  await generateAwsDomains();
  await generateAwsUsIpPrefixes(); // 添加新功能调用
  await saveGfwList();
}

main();