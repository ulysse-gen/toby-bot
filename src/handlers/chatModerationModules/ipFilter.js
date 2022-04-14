const ipv4FindRegex = "(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}";
const ipv4Regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;
const cannotBeThat = ["127.0.0.1"]

module.exports.ipFilter = async (_client, message, _guild = undefined) => {
    message.customMetric.addEntry(`IPFilter`);
    return new Promise((res, _rej) => {
        let findIp = message.content.matchAll(ipv4FindRegex);
        for (const potentialIp of findIp) {
            if (ipv4Regex.test(potentialIp[0]))res({result: true, value: potentialIp[0]});
        }
        res({result: false});
    });
}