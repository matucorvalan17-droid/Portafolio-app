// Maps common broker/exchange names → clearbit logo domain
const BROKER_DOMAINS: Record<string, string> = {
  // US Brokers
  'robinhood':            'robinhood.com',
  'coinbase':             'coinbase.com',
  'coinbase pro':         'coinbase.com',
  'coinbase advanced':    'coinbase.com',
  'fidelity':             'fidelity.com',
  'schwab':               'schwab.com',
  'charles schwab':       'schwab.com',
  'td ameritrade':        'tdameritrade.com',
  'etrade':               'etrade.com',
  'e*trade':              'etrade.com',
  'e-trade':              'etrade.com',
  'interactive brokers':  'interactivebrokers.com',
  'ibkr':                 'interactivebrokers.com',
  'webull':               'webull.com',
  'vanguard':             'vanguard.com',
  'blackrock':            'blackrock.com',
  'merrill':              'merrilledge.com',
  'merrill lynch':        'merrilledge.com',
  'merrill edge':         'merrilledge.com',
  'morgan stanley':       'morganstanley.com',
  'jp morgan':            'jpmorgan.com',
  'jpmorgan':             'jpmorgan.com',
  'sofi':                 'sofi.com',
  'sofi invest':          'sofi.com',
  'public':               'public.com',
  'moomoo':               'moomoo.com',
  'tastytrade':           'tastytrade.com',
  'ally':                 'ally.com',
  'ally invest':          'ally.com',
  'firstrade':            'firstrade.com',
  'm1 finance':           'm1.com',
  'm1':                   'm1.com',
  'acorns':               'acorns.com',
  'stash':                'stash.com',
  'betterment':           'betterment.com',
  'wealthfront':          'wealthfront.com',
  'tastyworks':           'tastyworks.com',
  'tradestation':         'tradestation.com',
  // Crypto Exchanges
  'binance':              'binance.com',
  'binance us':           'binance.us',
  'kraken':               'kraken.com',
  'gemini':               'gemini.com',
  'crypto.com':           'crypto.com',
  'bybit':                'bybit.com',
  'okx':                  'okx.com',
  'kucoin':               'kucoin.com',
  'bitfinex':             'bitfinex.com',
  'bitstamp':             'bitstamp.net',
  'huobi':                'huobi.com',
  'gate.io':              'gate.io',
  'mexc':                 'mexc.com',
  'bitget':               'bitget.com',
  'bitmex':               'bitmex.com',
  // Latin America
  'lemon cash':           'lemoncash.app',
  'lemon':                'lemoncash.app',
  'iol':                  'invertironline.com',
  'invertironline':       'invertironline.com',
  'portfolio personal':   'portfoliopersonal.com',
  'bull market':          'bullmarketbrokers.com',
  'balanz':               'balanz.com',
  'cocos':                'cocoscapital.com.ar',
  'cocos capital':        'cocoscapital.com.ar',
  'tiger':                'tigerbrokers.com',
  'tiger brokers':        'tigerbrokers.com',
  'bitso':                'bitso.com',
  'belo':                 'belo.app',
  'buenbit':              'buenbit.com',
  'satoshi tango':        'satoshitango.com',
  'ripio':                'ripio.com',
  // Europe
  'revolut':              'revolut.com',
  'trading 212':          'trading212.com',
  'freetrade':            'freetrade.io',
  'degiro':               'degiro.com',
  'etoro':                'etoro.com',
  'scalable capital':     'scalable.capital',
  'trade republic':       'traderepublic.com',
  // Other
  'paypal':               'paypal.com',
  'cash app':             'cash.app',
  'venmo':                'venmo.com',
};

export function getBrokerLogoUrl(brokerName: string): string | null {
  if (!brokerName?.trim()) return null;
  const key = brokerName.toLowerCase().trim();
  // Exact match
  if (BROKER_DOMAINS[key]) {
    return `https://logo.clearbit.com/${BROKER_DOMAINS[key]}`;
  }
  // Partial match
  for (const [k, domain] of Object.entries(BROKER_DOMAINS)) {
    if (key.includes(k) || k.includes(key)) {
      return `https://logo.clearbit.com/${domain}`;
    }
  }
  return null;
}

export function getBrokerInitial(brokerName: string): string {
  return (brokerName?.trim().charAt(0) ?? '?').toUpperCase();
}
