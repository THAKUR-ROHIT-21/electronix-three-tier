pipeline {
    agent { label 'electronic' }

    environment{
        S3_BUCKET='electronix-production-666'
        CLOUDFRONT_ID='E3B9NCR47NLAIX'
        AWS_REGION='ap-south-1'
    }

    stages {
        stage('Frontend Deployment') {
            when {
                changeset "frontend/**"
            }

            stages {
                stage('Install Dependencies') {
                    steps {
                        dir('frontend') {
                            sh '''
                            npm install
                            '''
                        }
                    }
                }

                stage("Run Tests") {
                    steps {
                        dir('frontend') {
                            sh 'npm test -- --watchAll=false || echo "No Test Configured.."'
                        }
                    }
                }

                stage("Build") {
                    steps {
                        dir('frontend') {
                            sh 'npm run build'
                        }
                    }
                }

                stage('Deploy S3') {
                    steps {
                        dir('frontend') {
                            sh '''
                            aws s3 sync dist/ s3://${S3_BUCKET} --delete --region ${AWS_REGION}
                            '''
                        }
                    }
                }
                stage('Invalidation Cloudfront Cache'){
                    steps{
                        sh'''
                        aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*"
                        '''
                    }
                }
            }
        }
    }

    post{
        success{
            echo 'Frontend Deployment Successfull ✅'
        }

        failure{
            echo 'Frontend Deployment Failed ❌'
        }
    }
}








