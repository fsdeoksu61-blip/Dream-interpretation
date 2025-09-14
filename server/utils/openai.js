const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('OpenAI API key not provided or is placeholder - using demo mode');
      this.client = null;
      return;
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI client initialized successfully');
  }

  async interpretDream(dreamContent) {
    if (!this.client) {
      // OpenAI API가 없을 때 데모용 해석 제공
      return this.getDemoInterpretation(dreamContent);
    }

    try {
      const prompt = `안녕하세요! 제가 당신의 꿈을 따뜻하게 해석해드리겠습니다.

꿈 내용: ${dreamContent}

이 꿈에 대해 상세하고 따뜻한 해석을 부탁드립니다. 다음과 같은 방식으로 자연스럽게 풀어서 설명해 주세요:

1. 꿈의 전체적인 의미와 메시지
2. 꿈 속 주요 상징과 요소들이 담고 있는 깊은 의미
3. 현재 당신의 삶과 마음 상태와의 연결점
4. 이 꿈이 전하는 희망적인 메시지와 실생활 조언
5. 마무리로 격려와 응원의 말씀

편안하고 친근한 어조로, 마치 가까운 친구나 상담사가 이야기하듯 자연스럽게 해석해 주세요.`;

      const response = await this.client.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "당신은 경험이 풍부한 꿈해몽 전문가이자 따뜻한 심리 상담사입니다. 꿈의 상징과 의미를 깊이 있게 분석하되, 항상 희망적이고 건설적인 관점에서 해석합니다. 마치 오랜 친구처럼 편안하고 자연스러운 어조로 대화하며, 꿈꾸는 이의 마음을 위로하고 격려하는 따뜻한 메시지를 전달합니다. 각 해석은 상세하고 개인적이며, 실생활에 도움이 되는 구체적인 조언을 포함해야 합니다."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      if (error.status === 401) {
        throw new Error('OpenAI API 키가 유효하지 않습니다.');
      } else if (error.status === 429) {
        throw new Error('API 사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.status === 500) {
        throw new Error('OpenAI 서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        throw new Error('꿈 해석 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  }

  // Test method to check if API key is working
  async testConnection() {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      });
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  // 데모용 해석 기능 (OpenAI API가 없을 때 사용)
  getDemoInterpretation(dreamContent) {
    console.log('Processing demo interpretation for:', dreamContent);
    const keywords = dreamContent;
    let interpretation = "**🌟 꿈 해석 결과 (데모 모드)**\n\n";

    // 키워드 기반 간단한 해석 로직 (한글 인코딩 문제 해결)
    const hasFlying = /날|하늘|비행|날아|공중|날다|flying|sky/.test(keywords);
    const hasWater = /물|바다|강|수영|파도|물가|water|ocean|sea/.test(keywords);
    const hasAnimals = /동물|개|고양이|새|강아지|animal|dog|cat|bird/.test(keywords);

    if (hasFlying) {
      interpretation += `**1. 전체적인 꿈의 의미**
하늘을 나는 꿈은 자유와 해방을 상징합니다. 현재의 제약이나 한계에서 벗어나고 싶은 강한 욕구를 나타내며, 높은 목표를 향한 의지를 보여줍니다.

**2. 주요 상징들의 의미**
- 하늘: 무한한 가능성과 꿈, 이상향
- 날기: 자유로운 사고와 창의성, 현실 초월 욕구
- 높은 곳: 성취하고자 하는 목표나 이상

**3. 현재 상황과의 연관성**
일상생활에서 느끼는 답답함이나 제약감에서 벗어나고 싶은 마음이 꿈으로 나타났을 수 있습니다. 새로운 도전이나 변화를 원하고 있을 가능성이 높습니다.

**4. 긍정적인 메시지나 조언**
이 꿈은 당신의 내면에 있는 무한한 잠재력을 상기시킵니다. 현실에서도 작은 변화부터 시도해보세요. 당신의 꿈과 목표를 향해 한 걸음씩 나아가는 것이 중요합니다.`;
    } else if (hasWater) {
      interpretation += `**1. 전체적인 꿈의 의미**
물과 관련된 꿈은 감정의 흐름과 정화를 의미합니다. 무의식의 깊은 부분이나 정서적 상태를 반영하며, 치유와 재생의 메시지를 담고 있습니다.

**2. 주요 상징들의 의미**
- 물: 감정, 무의식, 정화와 치유
- 흐르는 물: 시간의 흐름과 변화
- 깨끗한 물: 순수함과 새로운 시작

**3. 현재 상황과의 연관성**
감정적으로 정리가 필요한 시기이거나, 마음의 평화를 찾고 계신 것 같습니다. 스트레스나 걱정을 씻어내고 싶은 마음이 표현된 것일 수 있습니다.

**4. 긍정적인 메시지나 조언**
물의 흐름처럼 자연스럽게 감정을 받아들이고 표현하는 것이 중요합니다. 명상이나 휴식을 통해 마음의 평정을 찾아보세요. 모든 어려움은 흘러가게 되어 있습니다.`;
    } else if (hasAnimals) {
      interpretation += `**1. 전체적인 꿈의 의미**
동물이 나오는 꿈은 본능적 지혜와 직감을 상징합니다. 자연스러운 감정 표현이나 숨겨진 능력을 발견하라는 메시지일 수 있습니다.

**2. 주요 상징들의 의미**
- 동물: 본능, 직감, 자연스러운 감정
- 친근한 동물: 충실함, 사랑, 보호
- 야생 동물: 자유로운 정신, 원초적 에너지

**3. 현재 상황과의 연관성**
너무 이성적으로만 생각하지 말고 직감을 믿어볼 때입니다. 자연스러운 감정 표현을 억누르고 있지는 않은지 돌아보세요.

**4. 긍정적인 메시지나 조언**
동물들의 순수한 에너지를 본받아 솔직하고 자연스럽게 살아가세요. 직감을 신뢰하고 마음의 소리에 귀 기울여보세요.`;
    } else {
      interpretation += `**1. 전체적인 꿈의 의미**
모든 꿈은 우리 무의식의 소중한 메시지입니다. 이 꿈은 현재 당신의 내면 상태와 깊은 관련이 있으며, 성장과 발전의 기회를 제시하고 있습니다.

**2. 주요 상징들의 의미**
꿈 속의 모든 요소들은 당신의 내면 세계를 반영합니다. 각각의 이미지와 상황은 현재 당신이 직면한 상황이나 감정과 연결되어 있습니다.

**3. 현재 상황과의 연관성**
이 꿈은 현재 당신의 삶에서 일어나고 있는 변화나 성장 과정을 나타냅니다. 새로운 관점이나 해결책을 찾고 있을 수 있습니다.

**4. 긍정적인 메시지나 조언**
꿈은 항상 우리에게 희망과 가능성을 보여줍니다. 자신을 믿고 긍정적인 마음으로 앞으로 나아가세요. 모든 경험은 성장의 밑거름이 됩니다.`;
    }

    interpretation += "\n\n*💡 참고: 이것은 데모 해석입니다. 실제 OpenAI API를 설정하시면 더 정확하고 개인화된 해석을 받으실 수 있습니다.*";

    return interpretation;
  }
}

module.exports = new OpenAIService();