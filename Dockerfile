FROM garethr/kubeval:0.15.0

# Use SSL mirror for apk
RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/alpine.global.ssl.fastly.net/g' /etc/apk/repositories

RUN apk --no-cache add curl bash git openssh-client

COPY LICENSE README.md /

COPY src/deps.sh /deps.sh
RUN /deps.sh

COPY src/hrval.sh /usr/local/bin/hrval.sh
COPY src/hrval-all.sh /usr/local/bin/hrval

ENTRYPOINT ["hrval"]
