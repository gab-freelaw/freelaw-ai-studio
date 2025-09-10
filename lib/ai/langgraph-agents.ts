import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

// Define the state interface for legal workflow
interface LegalWorkflowState {
  messages: BaseMessage[];
  documentType?: string;
  legalArea?: string;
  analysis?: string;
  recommendations?: string[];
  citations?: string[];
  currentStep: string;
}

// Legal document classifier schema
const documentClassifierSchema = z.object({
  documentType: z.enum([
    'contract',
    'petition',
    'ruling',
    'law',
    'doctrine',
    'other'
  ]),
  legalArea: z.enum([
    'civil',
    'criminal',
    'labor',
    'tax',
    'corporate',
    'family',
    'constitutional',
    'administrative',
    'other'
  ]),
  confidence: z.number().min(0).max(1),
});

// Create specialized agents for different legal tasks
export class LegalAgentSystem {
  private model: ChatOpenAI;
  
  constructor(apiKey?: string) {
    this.model = new ChatOpenAI({
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o',
      temperature: 0.1, // Low temperature for legal accuracy
    });
  }
  
  // Document Classification Agent
  async classifyDocument(content: string) {
    const parser = StructuredOutputParser.fromZodSchema(documentClassifierSchema);
    
    const prompt = `
      Analyze the following legal document and classify it.
      Consider Brazilian legal standards and terminology.
      
      Document content:
      ${content.substring(0, 2000)}
      
      {format_instructions}
    `;
    
    const response = await this.model.invoke(
      prompt.replace('{format_instructions}', parser.getFormatInstructions())
    );
    
    return parser.parse(response.content as string);
  }
  
  // Legal Research Agent Graph
  createResearchGraph() {
    const workflow = new StateGraph<LegalWorkflowState>({
      channels: {
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
          default: () => [],
        },
        documentType: {
          value: (x?: string, y?: string) => y ?? x,
          default: () => undefined,
        },
        legalArea: {
          value: (x?: string, y?: string) => y ?? x,
          default: () => undefined,
        },
        analysis: {
          value: (x?: string, y?: string) => y ?? x,
          default: () => undefined,
        },
        recommendations: {
          value: (x?: string[], y?: string[]) => y ?? x,
          default: () => [],
        },
        citations: {
          value: (x?: string[], y?: string[]) => y ?? x,
          default: () => [],
        },
        currentStep: {
          value: (x: string, y: string) => y,
          default: () => 'start',
        },
      },
    });
    
    // Node: Understand Query
    workflow.addNode('understand_query', async (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      const response = await this.model.invoke([
        new HumanMessage(`
          Analyze this legal query and identify:
          1. The type of legal assistance needed
          2. The area of law involved
          3. Key legal concepts mentioned
          
          Query: ${lastMessage.content}
        `),
      ]);
      
      return {
        ...state,
        currentStep: 'search_legislation',
        messages: [response],
      };
    });
    
    // Node: Search Legislation
    workflow.addNode('search_legislation', async (state) => {
      const response = await this.model.invoke([
        new HumanMessage(`
          Based on the query, identify relevant Brazilian laws, articles, and statutes.
          Focus on:
          - Constitution articles
          - Civil Code provisions
          - Specific legislation
          - Recent law changes
          
          Context: ${state.messages.map(m => m.content).join('\n')}
        `),
      ]);
      
      return {
        ...state,
        currentStep: 'search_jurisprudence',
        messages: [response],
      };
    });
    
    // Node: Search Jurisprudence
    workflow.addNode('search_jurisprudence', async (state) => {
      const response = await this.model.invoke([
        new HumanMessage(`
          Find relevant Brazilian court decisions and precedents.
          Include:
          - STF and STJ decisions
          - Súmulas
          - Leading cases
          - Recent interpretations
          
          Context: ${state.messages.map(m => m.content).join('\n')}
        `),
      ]);
      
      return {
        ...state,
        currentStep: 'synthesize',
        messages: [response],
      };
    });
    
    // Node: Synthesize Results
    workflow.addNode('synthesize', async (state) => {
      const response = await this.model.invoke([
        new HumanMessage(`
          Synthesize all findings into a comprehensive legal analysis.
          Include:
          - Clear answer to the query
          - Supporting legislation
          - Relevant jurisprudence
          - Practical recommendations
          - Potential risks or considerations
          
          All findings: ${state.messages.map(m => m.content).join('\n')}
        `),
      ]);
      
      return {
        ...state,
        currentStep: 'end',
        analysis: response.content as string,
        messages: [response],
      };
    });
    
    // Define edges
    workflow.addEdge('understand_query' as any, 'search_legislation' as any);
    workflow.addEdge('search_legislation' as any, 'search_jurisprudence' as any);
    workflow.addEdge('search_jurisprudence' as any, 'synthesize' as any);
    workflow.addEdge('synthesize' as any, END);
    
    // Set entry point
    workflow.setEntryPoint('understand_query' as any);
    
    return workflow.compile();
  }
  
  // Contract Review Agent Graph
  createContractReviewGraph() {
    const workflow = new StateGraph<LegalWorkflowState>({
      channels: {
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
          default: () => [],
        },
        analysis: {
          value: (x?: string, y?: string) => y ?? x,
          default: () => undefined,
        },
        recommendations: {
          value: (x?: string[], y?: string[]) => y ?? x,
          default: () => [],
        },
        currentStep: {
          value: (x: string, y: string) => y,
          default: () => 'start',
        },
      },
    });
    
    // Add contract review specific nodes
    workflow.addNode('identify_parties', async (state) => {
      // Identify contracting parties
      return state;
    });
    
    workflow.addNode('analyze_clauses', async (state) => {
      // Analyze key clauses
      return state;
    });
    
    workflow.addNode('identify_risks', async (state) => {
      // Identify legal risks
      return state;
    });
    
    workflow.addNode('suggest_improvements', async (state) => {
      // Suggest improvements
      return state;
    });
    
    // Define edges
    workflow.addEdge('identify_parties' as any, 'analyze_clauses' as any);
    workflow.addEdge('analyze_clauses' as any, 'identify_risks' as any);
    workflow.addEdge('identify_risks' as any, 'suggest_improvements' as any);
    workflow.addEdge('suggest_improvements' as any, END);
    
    // Set entry point
    workflow.setEntryPoint('identify_parties' as any);
    
    return workflow.compile();
  }
}

// Export a default instance
export const legalAgents = new LegalAgentSystem();