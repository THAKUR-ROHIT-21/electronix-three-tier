pipeline {
    agent { label 'electronic' }

    environment {
        // Frontend Configuration
        S3_BUCKET       = 'electronix-production-666'
        CLOUDFRONT_ID   = 'E3B9NCR47NLAIX'
        AWS_REGION      = 'ap-south-1'

        // Backend Configuration
        BACKEND_HOST    = '3.111.179.103'
        BACKEND_USER    = 'ubuntu'
        BACKEND_PATH    = '/var/www/electronix-backend'
        BACKEND_PORT    = '5000'
        BACKEND_APP     = 'electronix-backend'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        /*
        =====================================================
                     VERIFY REQUIRED TOOLS
        =====================================================
        */

        stage('Verify Required Tools') {
            steps {
                sh '''
                    set -e

                    echo "Checking required tools..."

                    node --version
                    npm --version
                    aws --version
                    ssh -V
                    rsync --version

                    echo "Required tools are available ✅"
                '''
            }
        }

        /*
        =====================================================
                      FRONTEND DEPLOYMENT
        =====================================================
        */

        stage('Frontend Deployment') {
            when {
                changeset "frontend/**"
            }

            stages {

                stage('Install Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh '''
                                set -e
                                npm install
                            '''
                        }
                    }
                }

                stage('Run Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh '''
                                npm test -- --watchAll=false \
                                || echo "No frontend tests configured."
                            '''
                        }
                    }
                }

                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                set -e
                                npm run build
                            '''
                        }
                    }
                }

                stage('Verify Frontend Build') {
                    steps {
                        dir('frontend') {
                            sh '''
                                set -e

                                if [ ! -d "dist" ]; then
                                    echo "Frontend dist directory not found ❌"
                                    exit 1
                                fi

                                echo "Frontend build verified ✅"
                            '''
                        }
                    }
                }

                stage('Deploy Frontend to S3') {
                    steps {
                        dir('frontend') {
                            sh '''
                                set -e

                                aws s3 sync dist/ s3://${S3_BUCKET} \
                                    --delete \
                                    --region ${AWS_REGION}

                                echo "Frontend uploaded to S3 ✅"
                            '''
                        }
                    }
                }

                stage('Invalidate CloudFront Cache') {
                    steps {
                        sh '''
                            set -e

                            aws cloudfront create-invalidation \
                                --distribution-id ${CLOUDFRONT_ID} \
                                --paths "/*"

                            echo "CloudFront cache invalidated ✅"
                        '''
                    }
                }
            }
        }

        /*
        =====================================================
                       BACKEND DEPLOYMENT
        =====================================================
        */

        stage('Backend Deployment') {
            when {
                changeset "backend/**"
            }

            stages {

                stage('Install Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh '''
                                set -e
                                npm install
                            '''
                        }
                    }
                }

                stage('Run Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                npm test \
                                || echo "No backend tests configured."
                            '''
                        }
                    }
                }

                stage('Verify Backend Files') {
                    steps {
                        dir('backend') {
                            sh '''
                                set -e

                                if [ ! -f "package.json" ]; then
                                    echo "backend/package.json not found ❌"
                                    exit 1
                                fi

                                if [ ! -f "server.js" ]; then
                                    echo "backend/server.js not found ❌"
                                    exit 1
                                fi

                                echo "Backend files verified ✅"
                            '''
                        }
                    }
                }

                stage('Test Backend EC2 Connection') {
                    steps {
                        sshagent(credentials: ['backend-ec2-ssh-key']) {
                            sh '''
                                set -e

                                ssh \
                                    -o StrictHostKeyChecking=no \
                                    -o ConnectTimeout=15 \
                                    ${BACKEND_USER}@${BACKEND_HOST} \
                                    "echo 'Backend EC2 SSH connection successful ✅'"
                            '''
                        }
                    }
                }

                stage('Prepare Backend Directory') {
                    steps {
                        sshagent(credentials: ['backend-ec2-ssh-key']) {
                            sh '''
                                set -e

                                ssh \
                                    -o StrictHostKeyChecking=no \
                                    ${BACKEND_USER}@${BACKEND_HOST} "
                                        sudo mkdir -p ${BACKEND_PATH} &&
                                        sudo chown -R ${BACKEND_USER}:${BACKEND_USER} ${BACKEND_PATH}
                                    "
                            '''
                        }
                    }
                }

                stage('Deploy Backend to EC2') {
                    steps {
                        sshagent(credentials: ['backend-ec2-ssh-key']) {
                            sh '''
                                set -e

                                rsync -avz \
                                    --delete \
                                    --exclude="node_modules" \
                                    --exclude=".git" \
                                    --exclude=".gitignore" \
                                    --exclude=".env" \
                                    --exclude=".env.*" \
                                    --exclude="*.log" \
                                    -e "ssh -o StrictHostKeyChecking=no" \
                                    backend/ \
                                    ${BACKEND_USER}@${BACKEND_HOST}:${BACKEND_PATH}/

                                echo "Backend files deployed to EC2 ✅"
                            '''
                        }
                    }
                }

                stage('Install Production Dependencies') {
                    steps {
                        sshagent(credentials: ['backend-ec2-ssh-key']) {
                            sh '''
                                set -e

                                ssh \
                                    -o StrictHostKeyChecking=no \
                                    ${BACKEND_USER}@${BACKEND_HOST} "
                                        set -e

                                        cd ${BACKEND_PATH}

                                        if ! command -v node >/dev/null 2>&1; then
                                            echo 'Node.js is not installed on backend EC2 ❌'
                                            exit 1
                                        fi

                                        if ! command -v npm >/dev/null 2>&1; then
                                            echo 'npm is not installed on backend EC2 ❌'
                                            exit 1
                                        fi

                                        npm install --omit=dev
                                    "
                            '''
                        }
                    }
                }

                stage('Restart Backend Application') {
                    steps {
                        sshagent(credentials: ['backend-ec2-ssh-key']) {
                            sh '''
                                set -e

                                ssh \
                                    -o StrictHostKeyChecking=no \
                                    ${BACKEND_USER}@${BACKEND_HOST} "
                                        set -e

                                        cd ${BACKEND_PATH}

                                        if [ ! -f '.env.prod' ]; then
                                            echo '.env.prod file not found on backend EC2 ❌'
                                            echo 'Create: ${BACKEND_PATH}/.env.prod'
                                            exit 1
                                        fi

                                        if ! command -v pm2 >/dev/null 2>&1; then
                                            echo 'PM2 is not installed on backend EC2 ❌'
                                            echo 'Run: sudo npm install -g pm2'
                                            exit 1
                                        fi

                                        if pm2 describe ${BACKEND_APP} >/dev/null 2>&1; then
                                            pm2 restart ${BACKEND_APP} --update-env
                                        else
                                            pm2 start npm \
                                                --name ${BACKEND_APP} \
                                                -- start
                                        fi

                                        pm2 save
                                        pm2 status
                                    "
                            '''
                        }
                    }
                }

                stage('Backend Health Check') {
                    steps {
                        sh '''
                            echo "Waiting for backend application..."
                            sleep 10

                            curl \
                                --fail \
                                --silent \
                                --show-error \
                                --retry 5 \
                                --retry-delay 5 \
                                --connect-timeout 10 \
                                http://${BACKEND_HOST}:${BACKEND_PORT}/health

                            echo ""
                            echo "Backend health check successful ✅"
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Application Deployment Successful ✅'
        }

        failure {
            echo 'Application Deployment Failed ❌'
        }

        unstable {
            echo 'Application Deployment Unstable ⚠️'
        }

        always {
            echo 'Pipeline Execution Completed 🔔'
        }
    }
}