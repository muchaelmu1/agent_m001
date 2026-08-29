import random
import struct
import socket
import json
import os
import urllib.request
import urllib.error
from datetime import datetime


# ==========================================
# DNS RECORD TYPES
# ==========================================

DNS_RECORD_TYPES = {
    1: "A",
    2: "NS",
    5: "CNAME",
    6: "SOA",
    15: "MX",
    16: "TXT",
    28: "AAAA"
}


# ==========================================
# DNS NAME DECODER
# ==========================================

def read_dns_name(data, offset):

    labels = []
    original_offset = offset
    jumped = False
    visited = set()

    while True:

        if offset >= len(data):
            raise ValueError(
                "DNS name goes beyond packet"
            )

        if offset in visited:
            raise ValueError(
                "DNS compression loop detected"
            )

        visited.add(offset)

        length = data[offset]

        # DNS compression pointer
        if (length & 0xC0) == 0xC0:

            if offset + 1 >= len(data):
                raise ValueError(
                    "Incomplete DNS compression pointer"
                )

            pointer = (
                ((length & 0x3F) << 8)
                | data[offset + 1]
            )

            if pointer >= len(data):
                raise ValueError(
                    "Invalid DNS pointer"
                )

            if not jumped:
                original_offset = offset + 2

            offset = pointer
            jumped = True
            continue

        # Invalid label
        if length & 0xC0:
            raise ValueError(
                "Invalid DNS label"
            )

        # End of name
        if length == 0:

            offset += 1
            break

        # DNS labels cannot exceed 63 bytes
        if length > 63:
            raise ValueError(
                "DNS label is longer than 63 bytes"
            )

        offset += 1

        if offset + length > len(data):
            raise ValueError(
                "DNS label goes beyond packet"
            )

        label = data[
            offset:offset + length
        ]

        labels.append(
            label.decode(
                "ascii",
                errors="replace"
            )
        )

        offset += length

    name = ".".join(labels)

    if jumped:
        return name, original_offset

    return name, offset


# ==========================================
# REPUTATION CHECK
# ==========================================

def check_reputation(domain):

    reputation_info = {
        "checked": False,
        "malicious": False,
        "source": None,
        "reason": "Not checked"
    }

    # Read API key from environment
    api_key = os.environ.get(
        "GOOGLE_SAFE_BROWSING_API_KEY"
    )

    if not api_key:

        reputation_info["reason"] = (
            "Google Safe Browsing API key "
            "is not configured"
        )

        return reputation_info

    url = (
        "https://safebrowsing.googleapis.com/"
        "v4/threatMatches:find"
        "?key="
        + api_key
    )

    request_data = {

        "client": {
            "clientId": "dns-malware-checker",
            "clientVersion": "1.0"
        },

        "threatInfo": {

            "threatTypes": [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION"
            ],

            "platformTypes": [
                "ANY_PLATFORM"
            ],

            "threatEntryTypes": [
                "URL"
            ],

            "threatEntries": [
                {
                    "url": "https://" + domain + "/"
                }
            ]
        }
    }

    try:

        data = json.dumps(
            request_data
        ).encode("utf-8")

        request = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type":
                    "application/json"
            },
            method="POST"
        )

        with urllib.request.urlopen(
            request,
            timeout=10
        ) as response:

            response_data = response.read()

        result = json.loads(
            response_data.decode("utf-8")
        )

        reputation_info["checked"] = True

        reputation_info["source"] = (
            "Google Safe Browsing"
        )

        matches = result.get(
            "matches",
            []
        )

        if matches:

            reputation_info["malicious"] = True

            reputation_info["reason"] = (
                "Threat match found"
            )

        else:

            reputation_info["malicious"] = False

            reputation_info["reason"] = (
                "No threat match found"
            )

    except urllib.error.HTTPError as error:

        reputation_info["reason"] = (
            "HTTP error: "
            + str(error.code)
        )

    except urllib.error.URLError as error:

        reputation_info["reason"] = (
            "Network error: "
            + str(error.reason)
        )

    except TimeoutError:

        reputation_info["reason"] = (
            "Reputation request timed out"
        )

    except json.JSONDecodeError:

        reputation_info["reason"] = (
            "Invalid response from "
            "reputation service"
        )

    except Exception as error:

        reputation_info["reason"] = (
            "Reputation check failed: "
            + str(error)
        )

    return reputation_info


# ==========================================
# DNS RISK ANALYSIS
# ==========================================

def calculate_dns_risk(dns_info):

    score = 0
    reasons = []

    # No IPv4 address
    if not dns_info["ips"]:

        score += 10

        reasons.append(
            "No IPv4 A record found"
        )

    # Very low TTL
    for ttl in dns_info["ttl_values"]:

        if ttl < 60:

            score += 5

            reasons.append(
                f"Very low TTL detected: {ttl}"
            )

    # Many IPv4 addresses
    if len(dns_info["ips"]) >= 10:

        score += 5

        reasons.append(
            "Domain has many IPv4 addresses"
        )

    return min(score, 100), reasons


# ==========================================
# DOMAIN ANALYSIS
# ==========================================

def analyze_domain(domain):

    score = 0
    reasons = []

    clean_domain = domain.lower().rstrip(".")

    # Domain length
    if len(clean_domain) > 50:

        score += 10

        reasons.append(
            "Unusually long domain"
        )

    # Punycode
    if "xn--" in clean_domain:

        score += 10

        reasons.append(
            "Punycode/IDN detected"
        )

    labels = clean_domain.split(".")

    # Many labels
    if len(labels) >= 5:

        score += 10

        reasons.append(
            "Many domain labels/subdomains"
        )

    # Numeric-heavy labels
    for label in labels:

        if len(label) > 5:

            digit_count = sum(
                character.isdigit()
                for character in label
            )

            if (
                digit_count / len(label)
                > 0.5
            ):

                score += 10

                reasons.append(
                    "Label contains unusually "
                    "many numbers"
                )

                break

    # Very long label
    for label in labels:

        if len(label) > 30:

            score += 10

            reasons.append(
                "Very long individual "
                "domain label"
            )

            break

    return min(score, 100), reasons


# ==========================================
# DOMAIN INPUT
# ==========================================

print("================================")
print("DNS MALWARE CHECKER")
print("================================")

domain = input(
    "Enter domain to check: "
).strip().lower().rstrip(".")


if not domain:

    print(
        "ERROR: No domain entered."
    )

    raise SystemExit


if "://" in domain:

    print(
        "ERROR: Enter only the domain."
    )

    print(
        "Example: example.com"
    )

    raise SystemExit


if "/" in domain:

    print(
        "ERROR: Do not enter a URL."
    )

    print(
        "Example: example.com"
    )

    raise SystemExit


# ==========================================
# DOMAIN STRUCTURE CHECK
# ==========================================

parts = domain.split(".")


if len(parts) < 2:

    print(
        "ERROR: Enter a complete domain."
    )

    print(
        "Example: example.com"
    )

    raise SystemExit


for part in parts:

    if not part:

        print(
            "ERROR: Invalid domain."
        )

        raise SystemExit

    if len(part) > 63:

        print(
            "ERROR: DNS label is longer "
            "than 63 characters."
        )

        raise SystemExit


# ==========================================
# CREATE DNS HEADER
# ==========================================

transaction_id = random.randint(
    0,
    65535
)

flags = 0x0100

qdcount = 1
ancount = 0
nscount = 0
arcount = 0


header = struct.pack(
    "!HHHHHH",
    transaction_id,
    flags,
    qdcount,
    ancount,
    nscount,
    arcount
)


print("\n================================")
print("DNS HEADER")
print("================================")

print(
    "Transaction ID:",
    hex(transaction_id)
)

print(
    "Header length:",
    len(header),
    "bytes"
)


# ==========================================
# CREATE DNS QUESTION
# ==========================================

question = b""


try:

    for part in parts:

        encoded_part = part.encode(
            "ascii"
        )

        if len(encoded_part) > 63:

            raise ValueError(
                "DNS label is longer "
                "than 63 bytes"
            )

        question += bytes([
            len(encoded_part)
        ])

        question += encoded_part

except UnicodeEncodeError:

    print(
        "ERROR: Domain contains unsupported "
        "non-ASCII characters."
    )

    print(
        "Use the ASCII/Punycode form."
    )

    raise SystemExit


question += b"\x00"

# QTYPE = A
question += struct.pack(
    "!H",
    1
)

# QCLASS = IN
question += struct.pack(
    "!H",
    1
)


print("\n================================")
print("DNS QUESTION")
print("================================")

print(
    "Domain:",
    domain
)

print(
    "Question length:",
    len(question),
    "bytes"
)


# ==========================================
# COMPLETE DNS PACKET
# ==========================================

packet = header + question


print("\n================================")
print("DNS REQUEST")
print("================================")

print(
    "Packet length:",
    len(packet),
    "bytes"
)

print(
    "Packet:",
    packet.hex()
)


# ==========================================
# SEND DNS REQUEST
# ==========================================

dns_server = (
    "8.8.8.8",
    53
)

sock = socket.socket(
    socket.AF_INET,
    socket.SOCK_DGRAM
)

sock.settimeout(5)


print(
    "\nSending DNS request..."
)


try:

    sock.sendto(
        packet,
        dns_server
    )

    response, address = (
        sock.recvfrom(4096)
    )

except socket.timeout:

    print(
        "ERROR: DNS server did not respond."
    )

    raise SystemExit

except OSError as error:

    print(
        "Network error:",
        error
    )

    raise SystemExit

finally:

    sock.close()


print(
    "Response received!"
)

print(
    "DNS server:",
    address
)

print(
    "Response size:",
    len(response),
    "bytes"
)


# ==========================================
# RESPONSE HEADER
# ==========================================

if len(response) < 12:

    print(
        "ERROR: Response is shorter "
        "than 12 bytes."
    )

    raise SystemExit


fields = struct.unpack(
    "!HHHHHH",
    response[:12]
)


response_id = fields[0]
response_flags = fields[1]
questions = fields[2]
answers = fields[3]
authority = fields[4]
additional = fields[5]


print("\n================================")
print("DNS RESPONSE HEADER")
print("================================")

print(
    "Transaction ID:",
    hex(response_id)
)

print(
    "Questions:",
    questions
)

print(
    "Answers:",
    answers
)

print(
    "Authority:",
    authority
)

print(
    "Additional:",
    additional
)


# ==========================================
# VERIFY TRANSACTION ID
# ==========================================

if response_id != transaction_id:

    print(
        "\nERROR: Transaction ID mismatch!"
    )

    raise SystemExit


print(
    "Transaction ID verified!"
)


# ==========================================
# DNS FLAGS
# ==========================================

qr = (
    response_flags >> 15
) & 1

opcode = (
    response_flags >> 11
) & 0b1111

aa = (
    response_flags >> 10
) & 1

tc = (
    response_flags >> 9
) & 1

rd = (
    response_flags >> 8
) & 1

ra = (
    response_flags >> 7
) & 1

rcode = (
    response_flags
) & 0b1111


print("\n================================")
print("DNS FLAGS")
print("================================")

print("QR:", qr)
print("Opcode:", opcode)
print("AA:", aa)
print("TC:", tc)
print("RD:", rd)
print("RA:", ra)
print("RCODE:", rcode)


# ==========================================
# CHECK RESPONSE
# ==========================================

if qr != 1:

    print(
        "ERROR: Packet is not a DNS response."
    )

    raise SystemExit


# ==========================================
# DNS ERROR CODES
# ==========================================

if rcode != 0:

    error_names = {

        1: "Format error",
        2: "Server failure",
        3: "Domain does not exist",
        4: "Not implemented",
        5: "Query refused",
        9: "Server not authoritative"
    }

    print(
        "\nDNS returned an error:"
    )

    print(
        error_names.get(
            rcode,
            f"Unknown error ({rcode})"
        )
    )

    if rcode == 3:

        print(
            "\nThe domain does not exist."
        )

    raise SystemExit


# ==========================================
# DNS INTELLIGENCE
# ==========================================

dns_info = {

    "domain": domain,

    "checked_at":
        datetime.now().isoformat(),

    "ips": [],

    "cnames": [],

    "ttl_values": [],

    "record_types": []
}


# ==========================================
# FIND ANSWER SECTION
# ==========================================

offset = 12


try:

    _, offset = read_dns_name(
        response,
        offset
    )

except ValueError as error:

    print(
        "ERROR reading question name:",
        error
    )

    raise SystemExit


# QTYPE
if offset + 2 > len(response):

    print(
        "ERROR: Missing QTYPE."
    )

    raise SystemExit

offset += 2


# QCLASS
if offset + 2 > len(response):

    print(
        "ERROR: Missing QCLASS."
    )

    raise SystemExit

offset += 2


print(
    "\nAnswer starts at byte:",
    offset
)


# ==========================================
# READ ANSWERS
# ==========================================

print("\n================================")
print("DNS ANSWERS")
print("================================")


for i in range(answers):

    try:

        # NAME
        answer_name, offset = (
            read_dns_name(
                response,
                offset
            )
        )

        # TYPE
        if offset + 2 > len(response):

            raise ValueError(
                "Missing answer type"
            )

        answer_type = struct.unpack(
            "!H",
            response[
                offset:offset + 2
            ]
        )[0]

        offset += 2

        record_name = (
            DNS_RECORD_TYPES.get(
                answer_type,
                f"UNKNOWN ({answer_type})"
            )
        )

        # CLASS
        if offset + 2 > len(response):

            raise ValueError(
                "Missing answer class"
            )

        answer_class = struct.unpack(
            "!H",
            response[
                offset:offset + 2
            ]
        )[0]

        offset += 2

        # TTL
        if offset + 4 > len(response):

            raise ValueError(
                "Missing TTL"
            )

        ttl = struct.unpack(
            "!I",
            response[
                offset:offset + 4
            ]
        )[0]

        offset += 4

        # DATA LENGTH
        if offset + 2 > len(response):

            raise ValueError(
                "Missing data length"
            )

        data_length = struct.unpack(
            "!H",
            response[
                offset:offset + 2
            ]
        )[0]

        offset += 2

        # DATA
        if offset + data_length > len(response):

            raise ValueError(
                "Record data exceeds packet"
            )

        data_offset = offset

        answer_data = response[
            offset:
            offset + data_length
        ]

        offset += data_length

        # STORE
        dns_info[
            "record_types"
        ].append(answer_type)

        dns_info[
            "ttl_values"
        ].append(ttl)

        # DISPLAY
        print(
            "\nAnswer",
            i + 1
        )

        print(
            "Name:",
            answer_name
        )

        print(
            "Type:",
            answer_type,
            "(",
            record_name,
            ")"
        )

        print(
            "Class:",
            answer_class
        )

        print(
            "TTL:",
            ttl
        )

        print(
            "Data length:",
            data_length
        )

        # A RECORD
        if answer_type == 1:

            if data_length == 4:

                ip_address = ".".join(
                    str(byte)
                    for byte in answer_data
                )

                print(
                    "IPv4:",
                    ip_address
                )

                dns_info[
                    "ips"
                ].append(
                    ip_address
                )

            else:

                print(
                    "Invalid A record length."
                )

        # CNAME
        elif answer_type == 5:

            try:

                cname, _ = (
                    read_dns_name(
                        response,
                        data_offset
                    )
                )

                print(
                    "CNAME:",
                    cname
                )

                dns_info[
                    "cnames"
                ].append(
                    cname
                )

            except ValueError:

                print(
                    "Could not decode CNAME."
                )

        # OTHER RECORDS
        else:

            print(
                "Raw data:",
                answer_data
            )

    except ValueError as error:

        print(
            "\nERROR reading answer:",
            error
        )

        break


# ==========================================
# DOMAIN ANALYSIS
# ==========================================

domain_score, domain_reasons = (
    analyze_domain(domain)
)


print("\n================================")
print("DOMAIN ANALYSIS")
print("================================")

print(
    "Domain:",
    domain
)

print(
    "Domain score:",
    domain_score,
    "/ 100"
)


if domain_reasons:

    print("\nIndicators:")

    for reason in domain_reasons:

        print(
            " -",
            reason
        )

else:

    print(
        "No domain-structure "
        "indicators detected."
    )


# ==========================================
# DNS INTELLIGENCE
# ==========================================

print("\n================================")
print("DNS INTELLIGENCE")
print("================================")

print(
    "Domain:",
    dns_info["domain"]
)

print(
    "Checked:",
    dns_info["checked_at"]
)

print(
    "IPs:",
    dns_info["ips"]
)

print(
    "CNAMEs:",
    dns_info["cnames"]
)

print(
    "TTL values:",
    dns_info["ttl_values"]
)

print(
    "Record types:",
    dns_info["record_types"]
)


# ==========================================
# DNS RISK
# ==========================================

dns_score, dns_reasons = (
    calculate_dns_risk(
        dns_info
    )
)


# ==========================================
# REPUTATION CHECK
# ==========================================

print("\n================================")
print("REPUTATION CHECK")
print("================================")

reputation_info = (
    check_reputation(domain)
)


if reputation_info["checked"]:

    print(
        "Source:",
        reputation_info["source"]
    )

    if reputation_info["malicious"]:

        print(
            "Status: MALICIOUS"
        )

    else:

        print(
            "Status: NOT FLAGGED"
        )

    print(
        "Reason:",
        reputation_info["reason"]
    )

else:

    print(
        "Status: NOT CHECKED"
    )

    print(
        "Reason:",
        reputation_info["reason"]
    )


# ==========================================
# FINAL SCORE
# ==========================================

reputation_score = 0


if reputation_info["checked"]:

    if reputation_info["malicious"]:

        reputation_score = 70


# Combine all indicators
all_reasons = (
    dns_reasons
    + domain_reasons
)


if reputation_info["checked"]:

    if reputation_info["malicious"]:

        all_reasons.append(
            "Reputation service flagged "
            "this domain"
        )


total_score = min(
    dns_score
    + domain_score
    + reputation_score,
    100
)


# ==========================================
# VERDICT
# ==========================================

if total_score >= 70:

    verdict = "HIGH RISK"

elif total_score >= 30:

    verdict = "SUSPICIOUS"

else:

    verdict = "LOW RISK"


# ==========================================
# FINAL SECURITY REPORT
# ==========================================

print("\n================================")
print("FINAL SECURITY REPORT")
print("================================")

print("\nDOMAIN")

print(
    "Domain:",
    domain
)


print("\nDNS INTELLIGENCE")

if dns_info["cnames"]:

    print(
        "CNAME:",
        dns_info["cnames"][0]
    )

else:

    print(
        "CNAME: None"
    )


print(
    "IPv4 addresses:",
    len(dns_info["ips"])
)


for ip in dns_info["ips"]:

    print(
        " -",
        ip
    )


if dns_info["ttl_values"]:

    print(
        "TTL values:",
        dns_info["ttl_values"]
    )


print("\nDOMAIN ANALYSIS")


if domain_reasons:

    for reason in domain_reasons:

        print(
            " !",
            reason
        )

else:

    print(
        " ✓ No domain-structure indicators"
    )


print("\nREPUTATION")

if reputation_info["checked"]:

    print(
        "Source:",
        reputation_info["source"]
    )

    if reputation_info["malicious"]:

        print(
            "Status: MALICIOUS"
        )

    else:

        print(
            "Status: NOT FLAGGED"
        )

    print(
        "Reason:",
        reputation_info["reason"]
    )

else:

    print(
        "Status: NOT CHECKED"
    )

    print(
        "Reason:",
        reputation_info["reason"]
    )


print("\nRISK ASSESSMENT")
print("--------------------------------")

print(
    "DNS score:",
    dns_score,
    "/ 100"
)

print(
    "Domain score:",
    domain_score,
    "/ 100"
)

print(
    "Reputation score:",
    reputation_score,
    "/ 100"
)

print(
    "Total score:",
    total_score,
    "/ 100"
)

print(
    "Verdict:",
    verdict
)

print("--------------------------------")


if all_reasons:

    print("\nIndicators:")

    for reason in all_reasons:

        print(
            " -",
            reason
        )

else:

    print(
        "\nNo heuristic indicators detected."
    )


print("\n================================")
print("CHECK COMPLETE")
print("================================")