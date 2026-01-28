FROM buildpack-deps:bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget build-essential libpcre3 libpcre3-dev libssl-dev zlib1g-dev ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

ENV NGINX_VERSION=1.25.3
ENV RTMP_VERSION=1.2.2

RUN wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz && \
    wget https://github.com/arut/nginx-rtmp-module/archive/v${RTMP_VERSION}.tar.gz && \
    tar -zxvf nginx-${NGINX_VERSION}.tar.gz && \
    tar -zxvf v${RTMP_VERSION}.tar.gz && \
    cd nginx-${NGINX_VERSION} && \
    ./configure --add-module=../nginx-rtmp-module-${RTMP_VERSION} \
    --with-http_ssl_module \
    --with-http_v2_module && \
    make && make install

COPY nginx.conf /usr/local/nginx/conf/nginx.conf

EXPOSE 1935 8080

CMD ["/usr/local/nginx/sbin/nginx", "-g", "daemon off;"]
