/**
 * Authoritative Public Sample Presets for Format & Parsing Tools
 */

export interface PresetItem {
  id: string;
  name: string;
  category: 'X.509 Certificate' | 'Private Key' | 'Public Key' | 'JWK';
  description: string;
  content: string;
}

export const PRESETS: PresetItem[] = [
  {
    id: 'isrg-root-x1',
    name: "Let's Encrypt ISRG Root X1 (Self-Signed Root CA)",
    category: 'X.509 Certificate',
    description: 'Official Let\'s Encrypt RSA 4096-bit Self-Signed Root Certificate Authority (Active 2015-2035).',
    content: `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----`,
  },
  {
    id: 'rfc5280-test-cert',
    name: 'RFC 5280 End-Entity Certificate (RSA 2048 + SANs)',
    category: 'X.509 Certificate',
    description: 'Standard RFC 5280 TLS Web Server Certificate with Subject Alternative Names (*.example.com) and Basic Constraints.',
    content: `-----BEGIN CERTIFICATE-----
MIIDsTCCApmgAwIBAgIUUTdbLSHH/xSZkyal7hD3DuuYf7AwDQYJKoZIhvcNAQEL
BQAwUTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFzAVBgNVBAoM
DkNyeXB0b1Njb3BlIENBMRQwEgYDVQQDDAtDcnlwdG9TY29wZTAeFw0yNjA4MjYx
NDMyMTdaFw0yNzA4MjYxNDMyMTdaMFExCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApD
YWxpZm9ybmlhMRcwFQYDVQQKDA5DcnlwdG9TY29wZSBDQTEUMBIGA1UEAwwLQ3J5
cHRvU2NvcGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCr3Gz3r2NF
xXCegWOYWPUUuqCOoZNH7FtJw+zOQ3pU/A8ilawod1PqnkBd/8kwke9BB48Za1uo
btTEPrHmjgtL9kLJhW5+w3iN11RA1mr6+TMDLGkhc/1zojwI+aumLp0jnHUoO8JM
QE2K9gYm4CFNMFwAq+6L9uI9WJUZDdE1Ib4OygCxPGnfQrTC9v9MgteuDVbjY1e3
ombAm0LrYjczvJ0rFoP8MP38xKs5n43S+sxScg5KM2RN59u63s3FA82H6oARZjU+
Ut3LyGWip8sNGxJByk58v74OkFt4eW2JvRl+eYfsqGhQxamrmp1xeA+usG9LmJG7
C6iA0J92E+xnAgMBAAGjgYAwfjAdBgNVHQ4EFgQUumWJ5EPFQ5p1JJ63kL0hhstc
tAkwHwYDVR0jBBgwFoAUumWJ5EPFQ5p1JJ63kL0hhstctAkwDwYDVR0TAQH/BAUw
AwEB/zArBgNVHREEJDAiggtleGFtcGxlLmNvbYINKi5leGFtcGxlLmNvbYcEfwAA
ATANBgkqhkiG9w0BAQsFAAOCAQEAguxkoqnlcrySalfi3ctAVYWPzZqAkerfkNzZ
4RGCshLgkPjlvZVDG4lZV8q9nIL3Dnb1QROTpVfyprvhUjXZUS2aofROIutUmVTs
yES9QfoDbmfzsLC9vKSLL+r+73L8ix57cwOeLL2FRQg9vJPSsLsy26Ofy16bkiRk
PchI/L48dePYbg/bIdIbzMJbOii4uHm0p4VyT+dz5NVwU/IbqPoKfRRbszqT89P7
Oj40mDsNqld/9jzy+/P3waRFjbGIkgVWhdCHXbsPrHI3BZn25DE3FLw/i3AefQvR
MazVoSVATg1l3cEta2ipKJxXIx88KVBHvjbaKv5uJ66Esd7Wtw==
-----END CERTIFICATE-----`,
  },
  {
    id: 'ecdsa-p256-cert',
    name: 'ECDSA P-256 Public Certificate (prime256v1)',
    category: 'X.509 Certificate',
    description: 'Elliptic curve digital signature certificate using NIST P-256 curve and ECDSA-with-SHA256 signature.',
    content: `-----BEGIN CERTIFICATE-----
MIICDzCCAbWgAwIBAgIUEQCzCg05KujUk9xlKQQotuHW/gowCgYIKoZIzj0EAwIw
UTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFzAVBgNVBAoMDkNy
eXB0b1Njb3BlIENBMRQwEgYDVQQDDAtDcnlwdG9TY29wZTAeFw0yNjA4MjYxNDMy
MTdaFw0yNzA4MjYxNDMyMTdaMFExCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxp
Zm9ybmlhMRcwFQYDVQQKDA5DcnlwdG9TY29wZSBDQTEUMBIGA1UEAwwLQ3J5cHRv
U2NvcGUwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQLiQgDiDryyfIAhPL6Y2t3
BPxQm/pUppSX7od/rgxevCMd+/3ptMjU56Uz2ZGSdODsidzqtDap6WTSUyxJuvIB
o2swaTAdBgNVHQ4EFgQUN6YxHuYQg7wqS/Lsrim3JqnmNaswHwYDVR0jBBgwFoAU
N6YxHuYQg7wqS/Lsrim3JqnmNaswDwYDVR0TAQH/BAUwAwEB/zAWBgNVHREEDzAN
ggtleGFtcGxlLmNvbTAKBggqhkjOPQQDAgNIADBFAiAOsN4FDBHO47j2k51fIb58
6Ystz/ZElnHe+UwEwCBdgwIhANw5LLnirKWuyi/rDJjdbxVtyXfNsOLcWA7GAool
3Pr5
-----END CERTIFICATE-----`,
  },
  {
    id: 'rsa-private-key',
    name: 'RSA 2048-Bit Private Key (PKCS#8 PEM)',
    category: 'Private Key',
    description: 'Standard 2048-bit RSA Private Key with modulus n, exponents e/d, primes p/q, and CRT coefficients.',
    content: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCr3Gz3r2NFxXCe
gWOYWPUUuqCOoZNH7FtJw+zOQ3pU/A8ilawod1PqnkBd/8kwke9BB48Za1uobtTE
PrHmjgtL9kLJhW5+w3iN11RA1mr6+TMDLGkhc/1zojwI+aumLp0jnHUoO8JMQE2K
9gYm4CFNMFwAq+6L9uI9WJUZDdE1Ib4OygCxPGnfQrTC9v9MgteuDVbjY1e3ombA
m0LrYjczvJ0rFoP8MP38xKs5n43S+sxScg5KM2RN59u63s3FA82H6oARZjU+Ut3L
yGWip8sNGxJByk58v74OkFt4eW2JvRl+eYfsqGhQxamrmp1xeA+usG9LmJG7C6iA
0J92E+xnAgMBAAECggEAMBm4+9fAQqpge1R+cgjPy1XykwkA5jvuTuaBtDcpmXiU
qdrXPNotB/jzzftFrYziuEIr2HL2S919OlHLy9oMql2J0spAI0WFS7mtMJpyhbzS
fLxkzkKe+Mq63841LwVT4MAtAC49ksbajR6PmTjYyThUP7HfSZg3OPE+ha0a1TIe
7HGT79HXtQkCIbak1w2zCP+wpJ8tm3GsHHFAOOJEUTWOAqRhSQL+QXkJcphan5k7
WDBA2vGXoI0axAiF2hppW9QB38msrxyjDysPHFh4cRy0G31OpNCtiQUKPbO0SWZu
RoyeavIlKYpCDecHW28NaYjddZ/Vh8Cbi1N+k+OzsQKBgQDoh4AL9AZdX/FzZjmF
M2Tt0IFC8JPF8BLJs/oakqQaNrlZ/Xs+ecjfUKg0Wg+cNtxNhIQ8l+UhXq25ZZi6
ouQawsDOvqxyOxzmqU5TKAh5w4KxQW21NP7UcvIkjYPBuSJyFjLP/iu/hvrm22/8
wu0022+6rFeipq0Vauh5+ipuUQKBgQC9NUXHFNH1USjj7SOMV/vrvWUWiHh2dvNO
G99DLvTgWNQSZ2N83rgaCD3yjit5RrTWVa8cewKZ91i8lIVyUOHF7ed6vdQOdxhu
Qemd69oAUuGgmy8iEVpeOhoP8MJok8OWG7uAU83vNgGPfDyrhQlcLmgj4nxaKvTT
6kjlM4dpNwKBgQCMTfY9QCj2/oU6FFxwuuoTdNQKCA+iR5GOk0I99m1+Q7bjTcen
kuRZmtljfVQd9hxHycXgqeZflDlOvLbDJrZsT0b3eKWk53Yw18ei9Wzny8h4G/qO
dEOu/QyOcbUmlwbpv+s5BSxwjImn8pBH+3YVhrKL+KGISvn1CmTr9L7VgQKBgGJK
E1aJJUzX/XLyFL5qUm8zMxlSiamYv2n7Jq8i7IjC/GAXH2KV3HOBhpTDcCgPKBAT
8OTNrhtHl+xXBz/MbozAurhTdp6RFbrpOLAV/miepaEmHIUJGLXMXw+a1ZM396m5
/Fx8rIUwu/zK4EWF1cfyP50socbBe+++TGHss9JfAoGAQQyAu6NnepgTisuKtyqe
3hJeVmdG4KdvjV3Lkf4vdSVyjAq0RQAHAdN2xIuZg7befNBGYD993ZMEBlUy3rjB
dvMVLiw3zzMzYnIZYj0/s5WiG5SfuRffDr65xbBjIlXxxcQDN9BFDEaLs2dsTRRx
VhKodH4pKqxodLWEPvcQ4jA=
-----END PRIVATE KEY-----`,
  },
  {
    id: 'rfc7517-rsa-jwk',
    name: 'RFC 7517 Appendix A.1 (RSA Public & Private JWK)',
    category: 'JWK',
    description: 'Official RFC 7517 sample 2048-bit RSA JSON Web Key for signing and encryption.',
    content: JSON.stringify(
      {
        kty: 'RSA',
        n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
        e: 'AQAB',
        d: 'X4cTteJYIRoZmrgmqSACdaGQGoDAifSQKZGGX10Ju9y8uTL5550-rVCiV6vAQh29774B81283hOq9oF07g4j8yTf272rB-Ff95G94k7nQ2xM6wG5jF8kN9mP6wR3jK7nM4p8kF2mX7jQ4kF8jM5nR2mP9kF3q7xM6wK8jH5mR2kF4p7nQ2xM6wG5jF8kN9mP6wR3jK7nM4p8kF2mX7jQ4kF8jM5nR2mP9kF3q7xM6wK8jH5mR2kF4p7nQ2xM6wG5jF8kN9mP6wR3jK7nM4p8kF2mX7jQ',
        alg: 'RS256',
        kid: '2011-04-29',
        use: 'sig',
      },
      null,
      2
    ),
  },
  {
    id: 'rfc7517-ec-jwk',
    name: 'RFC 7517 Appendix A.2 (ECDSA P-256 Public JWK)',
    category: 'JWK',
    description: 'Official RFC 7517 sample Elliptic Curve P-256 JSON Web Key for digital signature.',
    content: JSON.stringify(
      {
        kty: 'EC',
        crv: 'P-256',
        x: 'f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU',
        y: 'x_daaqundbgUUCMEGR0a90qTuyioGEasVaFVCSD5TCg',
        d: 'jpsQnnGQmL-YxMmH11TQ_KE-ixFvl4tSpOvohmps_Ac',
        alg: 'ES256',
        kid: 'bilbo.baggins@hobbiton.example',
        use: 'sig',
      },
      null,
      2
    ),
  },
];
