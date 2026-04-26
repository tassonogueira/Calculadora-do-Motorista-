# 🚗 Driver Finance Pro

Sistema profissional de controle financeiro para motoristas de aplicativo (Uber/99).

## Funcionalidades

- 📊 **Dashboard em tempo real** - Acompanhe sua jornada, lucro e metas
- 🎯 **Plano de ação** - Defina metas diárias, semanais, mensais ou ciclos
- 🌤️ **Condições climáticas** - Impacto do clima na demanda
- 📈 **Histórico completo** - Todas as jornadas registradas
- ⚙️ **Configurações personalizáveis** - Veículos, custos fixos, perfil

## Tecnologias

- React 19 + TypeScript
- Vite (build tool)
- TailwindCSS (estilização)
- Geolocation API (rastreamento em tempo real)
- OpenWeatherMap API (condições climáticas)

## Como executar

```bash
# Clone o repositório
git clone https://github.com/tassonogueira/Calculadora-do-Motorista-.git
cd "Calculadora-do-Motorista-"

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves (veja abaixo)

# Execute o servidor de desenvolvimento
npm run dev
```

## Variáveis de ambiente

Crie um arquivo `.env.local` com as seguintes variáveis:

```env
# Opcional: para comandos de voz
VITE_VOICE_API_KEY=sua_chave_aqui

# Opcional: para clima em tempo real
VITE_OPENWEATHER_API_KEY=sua_chave_aqui

# Opcional: para login com Google
VITE_FIREBASE_API_KEY=sua_chave_aqui
```

## Estrutura do projeto

```
src/
├── components/     # Componentes React
├── hooks/         # Hooks customizados (geolocalização, localStorage)
├── services/      # APIs externas (clima, voz)
├── utils/         # Funções de cálculo e formatação
├── constants/     # Dados estáticos (cidades, veículos, taxas)
└── types/         # Interfaces TypeScript
```

## Licença

Private - Todos os direitos reservados.
