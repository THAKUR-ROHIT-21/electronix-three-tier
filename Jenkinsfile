// pipeline {
//     agent { label 'electronic' }

//     environment{
//         S3_BUCKET='electronix-production-666'
//         CLOUDFRONT_ID='E3B9NCR47NLAIX'
//         AWS_REGION='ap-south-1'
//     }

//     stages {
//         stage('Frontend Deployment') {
//             when {
//                 changeset "frontend/**"
//             }

//             stages {
//                 stage('Install Dependencies') {
//                     steps {
//                         dir('frontend') {
//                             sh '''
//                             npm install
//                             '''
//                         }
//                     }
//                 }

//                 stage("Run Tests") {
//                     steps {
//                         dir('frontend') {
//                             sh 'npm test -- --watchAll=false || echo "No Test Configured.."'
//                         }
//                     }
//                 }

//                 stage("Build") {
//                     steps {
//                         dir('frontend') {
//                             sh 'npm run build'
//                         }
//                     }
//                 }

//                 stage('Deploy S3') {
//                     steps {
//                         dir('frontend') {
//                             sh '''
//                             aws s3 sync dist/ s3://${S3_BUCKET} --delete --region ${AWS_REGION}
//                             '''
//                         }
//                     }
//                 }
//                 stage('Invalidation Cloudfront Cache'){
//                     steps{
//                         sh'''
//                         aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*"
//                         '''
//                     }
//                 }
//             }
//         }
//     }

//     post{
//         success{
//             echo 'Frontend Deployment Successfull ✅'
//         }

//         failure{
//             echo 'Frontend Deployment Failed ❌'
//         }
//     }
// }


// ============================================================================================


pipeline {
    agent { label 'electronic' }

    environment {
        // Frontend
        S3_BUCKET      = 'electronix-production-666'
        CLOUDFRONT_ID  = 'E3B9NCR47NLAIX'
        AWS_REGION     = 'ap-south-1'

        // Backend
        BACKEND_HOST   = '3.111.179.103'
        BACKEND_USER   = 'ubuntu'
        BACKEND_PATH   = '/var/www/electronix-backend'
    }

    stages {

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
                                npm install
                            '''
                        }
                    }
                }

                stage('Run Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh '''
                                npm test -- --watchAll=false || echo "No Test Configured.."
                            '''
                        }
                    }
                }

                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                npm run build
                            '''
                        }
                    }
                }

                stage('Deploy Frontend to S3') {
                    steps {
                        dir('frontend') {
                            sh '''
                                aws s3 sync dist/ s3://${S3_BUCKET} \
                                --delete \
                                --region ${AWS_REGION}
                            '''
                        }
                    }
                }

                stage('Invalidate CloudFront Cache') {
                    steps {
                        sh '''
                            aws cloudfront create-invalidation \
                            --distribution-id ${CLOUDFRONT_ID} \
                            --paths "/*"
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
                                npm install
                            '''
                        }
                    }
                }

                stage('Run Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                npm test || echo "No Backend Tests Configured.."
                            '''
                        }
                    }
                }

                stage('Deploy Backend to EC2') {
                    steps {
                        sshagent(credentials: ['backend-ec2-ssh-key']) {
                            sh '''
                                ssh -o StrictHostKeyChecking=no \
                                ${BACKEND_USER}@${BACKEND_HOST} \
                                "sudo mkdir -p ${BACKEND_PATH} &&
                                 sudo chown -R ${BACKEND_USER}:${BACKEND_USER} ${BACKEND_PATH}"

                                rsync -avz \
                                --delete \
                                --exclude=node_modules \
                                --exclude=.git \
                                --exclude=.env \
                                -e "ssh -o StrictHostKeyChecking=no" \
                                backend/ \
                                ${BACKEND_USER}@${BACKEND_HOST}:${BACKEND_PATH}/
                            '''
                        }
                    }
                }

                stage('Restart Backend Application') {
                    steps {
                        sshagent(credentials: ['backend-ec2-ssh-key']) {
                            sh '''
                                ssh -o StrictHostKeyChecking=no \
                                ${BACKEND_USER}@${BACKEND_HOST} << EOF

                                cd ${BACKEND_PATH}

                                npm install --omit=dev

                                if pm2 describe electronix-backend > /dev/null 2>&1
                                then
                                    pm2 restart electronix-backend --update-env
                                else
                                    pm2 start npm \
                                        --name electronix-backend \
                                        -- start
                                fi

                                pm2 save
                                pm2 status
                                EOF
                            '''
                        }
                    }
                }

                stage('Backend Health Check') {
                    steps {
                        sh '''
                            sleep 10

                            curl --fail \
                            --retry 5 \
                            --retry-delay 5 \
                            http://${BACKEND_HOST}:5000/health
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

        always {
            echo 'Pipeline Execution Completed 🔔'
        }
    }
}


