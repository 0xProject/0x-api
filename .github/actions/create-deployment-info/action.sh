git clone git@github.com:0xProject/0x-main-infra.git
cd 0x-main-infra/env/0x-api/$INPUT_ENV_FOLDER
sed -i -e "s/883408475785\.dkr\.ecr\.us-east-1\.amazonaws\.com\/0x\/api\:.*/883408475785\.dkr\.ecr\.us-east-1\.amazonaws\.com\/0x\/api\:$INPUT_SHA/g" common/*.yml apis/*.yml
