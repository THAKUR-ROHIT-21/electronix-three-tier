// pipeline {
//     agent {
//         label 'electronic'
//     }

//     stages {

//         stage("I am from Electronic") {
//             steps {
//                 echo "Hello From Electronic"
//             }
//         }

//         stage("Electronic setup") {
//             steps {
//                 echo "Electronic setup is working"
//             }
//         }
//     }

//     post {

//         success {
//             echo "Pipeline passed successfully ✅"

//             mail(
//                 to: "thakurrohitkr591@gmail.com",
//                 subject: "Success : Job '${env.JOB_NAME} #${env.BUILD_NUMBER}'",
//                 body: """
// '${env.JOB_NAME}' Build Succeeded ✅

// Build Number : ${env.BUILD_NUMBER}

// Check Build URL:
// ${env.BUILD_URL}
// """
//             )
//         }

//         failure {
//             echo "Pipeline failed ❌"

//             mail(
//                 to: "thakurrohitkr591@gmail.com",
//                 subject: "Failed : Job '${env.JOB_NAME} #${env.BUILD_NUMBER}'",
//                 body: """
// '${env.JOB_NAME}' Build Failed ❌

// Build Number : ${env.BUILD_NUMBER}

// Check Build URL:
// ${env.BUILD_URL}
// """
//             )
//         }

//         always {
//             echo "Pipeline execution completed 🔔"
//         }
//     }
// }


pipeline{
    agent{label 'electronic'}

    stages{
        stage('Code'){
            echo "This is for code"
        }
    }

    stage('Build'){
        echo "This is for build"
    }

    stage('Test'){
        echo "This is for Test"
    }
    
    stage('Deploy'){
        echo "This is for Deploy"
    }
}






